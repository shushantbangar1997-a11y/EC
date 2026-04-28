import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { db } from './db.js'
import { sendWelcomeEmail, sendQuoteConfirmation, sendOperatorNotification } from './emailService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'ec-secret-key-2024'
const DIST = join(__dirname, '../dist')

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// ── Serve built frontend static files ────────────────────────────────────────

app.use(express.static(DIST))

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sign(user) {
  const { password, ...safe } = user
  return { token: jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' }), user: safe }
}

function auth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token expired or invalid' })
  }
}

function role(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

function safe(user) {
  if (!user) return null
  const { password, ...rest } = user
  return rest
}

function qrToLead(qr) {
  return {
    ...qr,
    name: qr.customer_name || qr.name || 'Guest',
    phone: qr.customer_phone || qr.phone || '',
    email: qr.customer_email || qr.email || '',
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' })
    if (db.getUserByEmail(email)) return res.status(409).json({ message: 'Email already registered' })
    const hashed = bcrypt.hashSync(password, 10)
    const user = db.createUser({ name, email, password: hashed, phone: phone || '', role: 'customer' })
    sendWelcomeEmail(name, email).catch(err => console.error('[email] welcome failed:', err.message))
    res.status(201).json(sign(user))
  } catch (e) {
    res.status(500).json({ message: 'Registration failed', error: e.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = db.getUserByEmail(email)
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.json(sign(user))
  } catch (e) {
    res.status(500).json({ message: 'Login failed', error: e.message })
  }
})

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.getUser(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({ user: safe(user) })
})

// ── QUOTE REQUESTS ────────────────────────────────────────────────────────────

app.post('/api/quote-requests', (req, res) => {
  try {
    const { name, phone, email, pickup, dropoff, ride_date, passengers, vehicle_type, notes } = req.body
    if (!pickup || !dropoff) return res.status(400).json({ message: 'Pickup and dropoff required' })

    const token = req.headers.authorization?.slice(7)
    let customerId = null
    try { if (token) { const d = jwt.verify(token, JWT_SECRET); customerId = d.id } } catch {}

    const qr = db.createQuoteRequest({
      customer_name: name || 'Guest',
      customer_phone: phone || '',
      customer_email: email || '',
      customer_id: customerId,
      pickup,
      dropoff,
      ride_date,
      passengers: passengers || 1,
      vehicle_type: vehicle_type || 'sedan',
      notes: notes || '',
      status: 'pending',
    })
    if (email) {
      sendQuoteConfirmation(name || 'Guest', email, pickup, dropoff, vehicle_type || 'sedan')
        .catch(err => console.error('[email] quote confirmation failed:', err.message))
    }
    sendOperatorNotification({
      name: name || 'Guest',
      email: email || '',
      phone: phone || '',
      pickup,
      dropoff,
      vehicleType: vehicle_type || 'sedan',
      passengers: passengers || 1,
      rideDate: ride_date || '',
    }).catch(err => console.error('[email] operator notification failed:', err.message))
    res.status(201).json({ success: true, data: qr })
  } catch (e) {
    res.status(500).json({ message: 'Could not create quote request', error: e.message })
  }
})

app.get('/api/quote-requests', auth, role('operator', 'admin'), (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query
    let list = db.listQuoteRequests({ status, search })
    const total = list.length
    const totalPages = Math.ceil(total / Number(limit)) || 1
    const start = (Number(page) - 1) * Number(limit)
    const items = list.slice(start, start + Number(limit)).map(qr => ({
      ...qrToLead(qr),
      bids: db.getBidsForRequest(qr.id),
    }))
    res.json({ data: items, pagination: { total, totalPages, page: Number(page), limit: Number(limit) } })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch requests', error: e.message })
  }
})

app.get('/api/quote-requests/:id', (req, res) => {
  try {
    const qr = db.getQuoteRequest(req.params.id)
    if (!qr) return res.status(404).json({ message: 'Quote request not found' })

    // Authorization: caller must be (a) the owning customer, (b) an admin/operator,
    // or (c) hold the per-quote unguessable token issued at creation. This prevents
    // sequential-id enumeration of other customers' quotes and bids.
    const token = req.headers.authorization?.slice(7)
    let caller = null
    try { if (token) caller = jwt.verify(token, JWT_SECRET) } catch {}
    const providedQuoteToken = req.query.token || req.headers['x-quote-token']
    const isOwner = caller && qr.customer_id && caller.id === qr.customer_id
    const isStaff = caller && (caller.role === 'admin' || caller.role === 'operator')
    const tokenOK = qr.quote_token && providedQuoteToken === qr.quote_token
    if (!isOwner && !isStaff && !tokenOK) {
      return res.status(401).json({ message: 'Authorization required to view this quote request' })
    }

    // Customer/guest view excludes withdrawn bids — staff see the full history.
    const allBids = db.getBidsForRequest(qr.id)
    const bids = isStaff
      ? allBids
      : allBids.filter(b => (b.status || 'pending') !== 'withdrawn')
    res.json({ success: true, data: { ...qrToLead(qr), bids } })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch quote request', error: e.message })
  }
})

app.patch('/api/quote-requests/:id', auth, role('operator', 'admin'), (req, res) => {
  try {
    const { bid_price, eta_minutes, notes, status, vehicle_type, ...rest } = req.body
    const updates = { ...rest }
    if (status) updates.status = status
    if (vehicle_type) updates.vehicle_type = vehicle_type
    if (bid_price) updates.bid_price = Number(bid_price)
    if (eta_minutes) updates.eta_minutes = Number(eta_minutes)
    if (notes !== undefined) updates.notes = notes

    if (bid_price) {
      const operator = db.getUser(req.user.id)
      db.createBid({
        quote_request_id: req.params.id,
        operator_id: req.user.id,
        operator_name: operator?.name || 'Everywhere Cars',
        price: Number(bid_price),
        vehicle_type: vehicle_type || 'sedan',
        eta_minutes: eta_minutes ? Number(eta_minutes) : 30,
        message: notes || '',
        notes: notes || '',
      })
      if (!status) updates.status = 'quoted'
    }

    const updated = db.updateQuoteRequest(req.params.id, updates)
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true, data: qrToLead(updated) })
  } catch (e) {
    res.status(500).json({ message: 'Update failed', error: e.message })
  }
})

app.patch('/api/quote-requests/:id/status', auth, role('operator', 'admin'), (req, res) => {
  try {
    const { status } = req.body
    const updated = db.updateQuoteRequest(req.params.id, { status })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true, data: qrToLead(updated) })
  } catch (e) {
    res.status(500).json({ message: 'Status update failed', error: e.message })
  }
})

// ── BIDS ──────────────────────────────────────────────────────────────────────

app.post('/api/quote-requests/:id/bids', auth, role('operator', 'admin'), (req, res) => {
  try {
    const qr = db.getQuoteRequest(req.params.id)
    if (!qr) return res.status(404).json({ message: 'Quote request not found' })
    const operator = db.getUser(req.user.id)
    const { price, vehicle_type, eta_minutes, message, notes } = req.body
    if (!price) return res.status(400).json({ message: 'Price required' })
    const bid = db.createBid({
      quote_request_id: qr.id,
      operator_id: req.user.id,
      operator_name: operator?.name || 'Everywhere Transfers',
      price: Number(price),
      vehicle_type: vehicle_type || qr.vehicle_type,
      eta_minutes: eta_minutes ? Number(eta_minutes) : 30,
      message: message || notes || '',
      notes: message || notes || '',
      status: 'pending',
    })
    db.updateQuoteRequest(qr.id, { status: 'quoted', bid_price: Number(price) })
    res.status(201).json({ success: true, data: bid })
  } catch (e) {
    res.status(500).json({ message: 'Could not submit bid', error: e.message })
  }
})

// Customer accepts a specific bid — marks accepted, declines siblings, confirms ride
app.post('/api/quote-requests/:id/accept-bid', (req, res) => {
  try {
    const qr = db.getQuoteRequest(req.params.id)
    if (!qr) return res.status(404).json({ message: 'Quote request not found' })
    const { bid_id } = req.body
    if (!bid_id) return res.status(400).json({ message: 'bid_id required' })

    // Optional auth — derive caller identity if a token is present
    const token = req.headers.authorization?.slice(7)
    let caller = null
    try { if (token) caller = jwt.verify(token, JWT_SECRET) } catch {}

    // Authorization. The caller must be one of:
    //   (a) the owning logged-in customer
    //   (b) an admin acting on the customer's behalf
    //   (c) a guest who holds the per-quote unguessable token issued at creation
    // This blocks IDOR via sequential quote/bid IDs.
    const providedQuoteToken = req.body.quote_token || req.headers['x-quote-token']
    const isOwner = caller && qr.customer_id && caller.id === qr.customer_id
    const isAdmin = caller && caller.role === 'admin'
    const tokenOK = qr.quote_token && providedQuoteToken === qr.quote_token
    if (qr.customer_id) {
      if (!isOwner && !isAdmin) {
        return res.status(caller ? 403 : 401).json({ message: 'You are not allowed to accept this offer' })
      }
    } else if (!tokenOK && !isAdmin) {
      return res.status(401).json({ message: 'A valid quote token is required to accept this offer' })
    }

    // State guards — prevent double-accept / racing
    if (['confirmed', 'booked', 'completed', 'cancelled'].includes(qr.status)) {
      return res.status(409).json({ message: `This ride is already ${qr.status}` })
    }
    const bid = db.getBid(bid_id)
    if (!bid || bid.quote_request_id !== qr.id) {
      return res.status(404).json({ message: 'Bid not found for this request' })
    }
    if ((bid.status || 'pending') !== 'pending') {
      return res.status(409).json({ message: `This offer is no longer ${bid.status === 'accepted' ? 'available' : bid.status}` })
    }

    db.updateBid(bid_id, { status: 'accepted' })
    db.getBidsForRequest(qr.id).forEach(b => {
      if (b.id !== bid_id && (b.status || 'pending') === 'pending') {
        db.updateBid(b.id, { status: 'declined' })
      }
    })
    const updated = db.updateQuoteRequest(qr.id, {
      status: 'confirmed',
      bid_price: bid.price,
      vehicle_type: bid.vehicle_type,
      accepted_bid_id: bid_id,
    })
    res.json({ success: true, data: { request: qrToLead(updated), bid: db.getBid(bid_id) } })
  } catch (e) {
    res.status(500).json({ message: 'Could not accept bid', error: e.message })
  }
})

// ── BID EDIT / WITHDRAW ───────────────────────────────────────────────────────

// Operator edits one of their own pending bids — price, vehicle, ETA, note.
// Locked once accepted (or declined / withdrawn).
app.patch('/api/bids/:id', auth, role('operator', 'admin'), (req, res) => {
  try {
    const bid = db.getBid(req.params.id)
    if (!bid) return res.status(404).json({ message: 'Bid not found' })
    if (bid.operator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own bids' })
    }
    const status = bid.status || 'pending'
    if (status !== 'pending') {
      return res.status(409).json({ message: `This bid is ${status} and can no longer be edited` })
    }
    const { price, vehicle_type, eta_minutes, message, notes } = req.body
    const updates = {}
    if (price !== undefined) {
      const n = Number(price)
      if (!n || n <= 0) return res.status(400).json({ message: 'Price must be a positive number' })
      updates.price = n
    }
    if (vehicle_type !== undefined) updates.vehicle_type = vehicle_type
    if (eta_minutes !== undefined) {
      const e = Number(eta_minutes)
      if (!Number.isFinite(e) || e < 0) return res.status(400).json({ message: 'ETA must be a non-negative number' })
      updates.eta_minutes = e
    }
    if (message !== undefined || notes !== undefined) {
      const m = message ?? notes ?? ''
      updates.message = m
      updates.notes = m
    }
    const updated = db.updateBid(bid.id, updates)
    // Keep quote_request.bid_price in sync with the latest pending bid for legacy callers
    if (updates.price !== undefined) {
      const qr = db.getQuoteRequest(bid.quote_request_id)
      if (qr && (qr.status === 'quoted' || qr.status === 'pending')) {
        db.updateQuoteRequest(qr.id, { bid_price: updates.price })
      }
    }
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(500).json({ message: 'Could not update bid', error: e.message })
  }
})

// Operator withdraws a pending bid (soft-mark withdrawn so history is preserved)
app.post('/api/bids/:id/withdraw', auth, role('operator', 'admin'), (req, res) => {
  try {
    const bid = db.getBid(req.params.id)
    if (!bid) return res.status(404).json({ message: 'Bid not found' })
    if (bid.operator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only withdraw your own bids' })
    }
    const status = bid.status || 'pending'
    if (status !== 'pending') {
      return res.status(409).json({ message: `This bid is ${status} and can no longer be withdrawn` })
    }
    const updated = db.updateBid(bid.id, { status: 'withdrawn' })
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(500).json({ message: 'Could not withdraw bid', error: e.message })
  }
})

// ── BID MESSAGES (per-bid thread) ─────────────────────────────────────────────

// Caller may read/write a bid's thread if any of:
//   (a) operator who owns the bid
//   (b) admin
//   (c) logged-in customer who owns the originating quote request
//   (d) guest holding the matching quote_token (header or query/body)
function authorizeBidThread(req, bid) {
  const qr = db.getQuoteRequest(bid.quote_request_id)
  if (!qr) return { ok: false, status: 404, message: 'Originating ride not found' }

  const tokenHeader = req.headers.authorization
  let caller = null
  if (tokenHeader?.startsWith('Bearer ')) {
    try { caller = jwt.verify(tokenHeader.slice(7), JWT_SECRET) } catch {}
  }
  const providedQuoteToken =
    req.body?.quote_token || req.query?.token || req.headers['x-quote-token']

  // If a JWT is present, evaluate ONLY against the caller's identity. Falling
  // through to the quote-token mode would let any logged-in (but unrelated)
  // user piggy-back on a known token to read/write someone else's thread.
  if (caller) {
    if (caller.role === 'admin') return { ok: true, qr, sender: { kind: 'admin', id: caller.id } }
    if (caller.role === 'operator' && bid.operator_id === caller.id) {
      return { ok: true, qr, sender: { kind: 'operator', id: caller.id } }
    }
    if (qr.customer_id && caller.id === qr.customer_id) {
      return { ok: true, qr, sender: { kind: 'customer', id: caller.id } }
    }
    return { ok: false, status: 403, message: 'Not allowed to view this thread' }
  }
  // No JWT — guest path. Allow only with a matching unguessable per-quote token.
  if (qr.quote_token && providedQuoteToken && providedQuoteToken === qr.quote_token) {
    return { ok: true, qr, sender: { kind: 'customer', id: null, guest: true } }
  }
  return { ok: false, status: 401, message: 'Not allowed to view this thread' }
}

app.get('/api/bids/:id/messages', (req, res) => {
  try {
    const bid = db.getBid(req.params.id)
    if (!bid) return res.status(404).json({ message: 'Bid not found' })
    const auth = authorizeBidThread(req, bid)
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message })
    res.json({ success: true, data: db.listBidMessages(bid.id) })
  } catch (e) {
    res.status(500).json({ message: 'Could not load messages', error: e.message })
  }
})

app.post('/api/bids/:id/messages', (req, res) => {
  try {
    const bid = db.getBid(req.params.id)
    if (!bid) return res.status(404).json({ message: 'Bid not found' })
    const auth = authorizeBidThread(req, bid)
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message })
    const body = String(req.body?.body || '').trim().slice(0, 1000)
    if (!body) return res.status(400).json({ message: 'Message body is required' })
    const sender = auth.sender
    const senderName = sender.kind === 'customer'
      ? (auth.qr.customer_name || auth.qr.name || 'Customer')
      : (db.getUser(sender.id)?.name || 'Operator')
    const msg = db.createBidMessage({
      bid_id: bid.id,
      quote_request_id: bid.quote_request_id,
      sender_kind: sender.kind === 'admin' ? 'operator' : sender.kind,
      sender_id: sender.id || null,
      sender_name: senderName,
      body,
    })
    // Bump bid's updated_at for "Updated just now" UX hints
    db.updateBid(bid.id, {})
    res.status(201).json({ success: true, data: msg })
  } catch (e) {
    res.status(500).json({ message: 'Could not send message', error: e.message })
  }
})

// ── ADMIN PORTAL ──────────────────────────────────────────────────────────────

// Compute urgency score from ride_date
function computeUrgency(rideDate) {
  if (!rideDate) return { urgency_score: 0, urgency_label: 'ASAP' }
  const ms = Date.parse(rideDate)
  if (Number.isNaN(ms)) return { urgency_score: 0, urgency_label: 'ASAP' }
  const hoursUntil = (ms - Date.now()) / 36e5
  if (hoursUntil < 0) return { urgency_score: 0, urgency_label: 'ASAP' }
  if (hoursUntil < 2) return { urgency_score: 4, urgency_label: 'Critical' }
  if (hoursUntil < 6) return { urgency_score: 3, urgency_label: 'Soon' }
  // "Today" = same calendar day as now (in local server time), not just <24h
  const pickup = new Date(ms)
  const now = new Date()
  const sameDay = pickup.getFullYear() === now.getFullYear() &&
                  pickup.getMonth() === now.getMonth() &&
                  pickup.getDate() === now.getDate()
  if (sameDay) return { urgency_score: 2, urgency_label: 'Today' }
  return { urgency_score: 1, urgency_label: 'Flexible' }
}

// New orders feed (with optional `since` ISO timestamp for badge polling)
app.get('/api/admin/orders', auth, role('admin', 'operator'), (req, res) => {
  try {
    const { since, limit = 100 } = req.query
    let list = db.listQuoteRequests()
    if (since) {
      const sinceMs = Date.parse(since)
      if (!Number.isNaN(sinceMs)) {
        list = list.filter(q => Date.parse(q.created_at) > sinceMs)
      }
    }
    const items = list.slice(0, Number(limit)).map(qr => ({
      ...qrToLead(qr),
      ...computeUrgency(qr.ride_date),
      bids: db.getBidsForRequest(qr.id),
    }))
    res.json({ data: items, count: items.length, server_time: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch orders', error: e.message })
  }
})

// Admin's own bids, optionally filtered by status, enriched with the order summary
app.get('/api/admin/my-bids', auth, role('admin', 'operator'), (req, res) => {
  try {
    const { status } = req.query
    const list = db.listBids({ operator_id: req.user.id, status })
    const items = list.map(b => {
      const qr = db.getQuoteRequest(b.quote_request_id)
      return {
        ...b,
        request: qr ? qrToLead(qr) : null,
      }
    })
    res.json({ data: items })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch bids', error: e.message })
  }
})

// Earnings summary from accepted bids
app.get('/api/admin/earnings', auth, role('admin', 'operator'), (req, res) => {
  try {
    const accepted = db.listBids({ operator_id: req.user.id, status: 'accepted' })
    const total = accepted.reduce((s, b) => s + (Number(b.price) || 0), 0)
    const pending = db.listBids({ operator_id: req.user.id, status: 'pending' }).length
    const declined = db.listBids({ operator_id: req.user.id, status: 'declined' }).length
    res.json({
      data: {
        accepted_count: accepted.length,
        accepted_total: total,
        pending_count: pending,
        declined_count: declined,
        recent: accepted.slice(0, 10).map(b => ({
          ...b,
          request: db.getQuoteRequest(b.quote_request_id) ? qrToLead(db.getQuoteRequest(b.quote_request_id)) : null,
        })),
      }
    })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch earnings', error: e.message })
  }
})

// ── OPERATOR DASHBOARD ────────────────────────────────────────────────────────

app.get('/api/operator/dashboard', auth, role('operator', 'admin'), (req, res) => {
  try {
    const all = db.listQuoteRequests()
    const pending = all.filter(r => r.status === 'pending' || r.status === 'new').length
    const quoted = all.filter(r => r.status === 'quoted' || r.status === 'contacted').length
    const completed = all.filter(r => r.status === 'completed' || r.status === 'booked').length
    const bids = all.flatMap(r => db.getBidsForRequest(r.id))
    const revenue = bids.reduce((s, b) => s + (b.price || 0), 0)
    res.json({
      data: {
        stats: {
          pending_requests: pending,
          active_bids: quoted,
          completed_rides: completed,
          total_revenue: revenue,
          total_requests: all.length,
        }
      }
    })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch dashboard', error: e.message })
  }
})

app.get('/api/operator/requests', auth, role('operator', 'admin'), (req, res) => {
  try {
    const { limit = 10, status, search } = req.query
    let list = db.listQuoteRequests({ status, search }).slice(0, Number(limit))
    res.json({ data: list.map(qr => ({ ...qrToLead(qr), bids: db.getBidsForRequest(qr.id) })) })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch requests', error: e.message })
  }
})

// ── DRIVERS ───────────────────────────────────────────────────────────────────

app.get('/api/drivers', auth, role('operator', 'admin'), (req, res) => {
  try {
    const opId = req.user.role === 'admin' ? undefined : req.user.id
    res.json({ data: db.listDrivers(opId) })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch drivers', error: e.message })
  }
})

app.post('/api/drivers', auth, role('operator', 'admin'), (req, res) => {
  try {
    const { name, phone, vehicle_type, vehicle, plate } = req.body
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone required' })
    const driver = db.createDriver({ operator_id: req.user.id, name, phone, vehicle_type: vehicle_type || 'sedan', vehicle: vehicle || '', plate: plate || '', status: 'available' })
    res.status(201).json({ success: true, data: driver })
  } catch (e) {
    res.status(500).json({ message: 'Could not create driver', error: e.message })
  }
})

// ── USERS (admin) ─────────────────────────────────────────────────────────────

app.get('/api/users', auth, role('admin'), (req, res) => {
  try {
    res.json({ data: db.listUsers().map(safe) })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch users', error: e.message })
  }
})

// ── REVENUE ───────────────────────────────────────────────────────────────────

app.get('/api/revenue', auth, role('operator', 'admin'), (req, res) => {
  try {
    const requests = db.listQuoteRequests()
    const completed = requests.filter(r => r.status === 'completed' || r.status === 'booked')
    const bids = completed.flatMap(r => db.getBidsForRequest(r.id))
    const total = bids.reduce((s, b) => s + (b.price || 0), 0)
    res.json({
      data: {
        total_revenue: total,
        completed_rides: completed.length,
        pending_rides: requests.filter(r => r.status === 'pending').length,
        total_requests: requests.length,
        monthly: [],
      }
    })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch revenue', error: e.message })
  }
})

// ── HEALTH ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ── SPA FALLBACK — must be last ───────────────────────────────────────────────

app.use((req, res) => {
  const indexPath = join(DIST, 'index.html')
  if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(503).send('Frontend not built. Run: npm run build')
  }
})

// ── START ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[API] Server running on port ${PORT}`)
  console.log(`[API] Serving frontend from: ${DIST}`)
  console.log(`[API] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
})
