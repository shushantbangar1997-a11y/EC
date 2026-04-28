import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { fileURLToPath } from 'url'
import { join, dirname, extname } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { randomBytes } from 'crypto'
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

// ── Chat helpers (token + input sanitisation) ────────────────────────────────
//
// The visitor side of live chat is anonymous, so the only way to prove
// ownership of a session_id is a server-issued, signed token. We sign with the
// same JWT_SECRET as user tokens but tag the payload with `kind: 'chat'` so
// admin endpoints never accidentally accept it.

function signChatToken(session_id) {
  return jwt.sign({ kind: 'chat', session_id }, JWT_SECRET, { expiresIn: '30d' })
}

function verifyChatToken(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded?.kind !== 'chat' || !decoded.session_id) return null
    return decoded
  } catch {
    return null
  }
}

// Strip control characters and clamp length. Anything that ends up rendered in
// the admin UI (name, email, page_url, body) goes through this to defang the
// most obvious abuse vectors. React still escapes HTML, so XSS is not the
// concern here — UI poisoning and storage bloat are.
function clean(input, max) {
  if (input == null) return ''
  return String(input).replace(/[\x00-\x1F\x7F]/g, '').slice(0, max).trim()
}

function newVisitorSessionId() {
  return 'v_' + randomBytes(12).toString('hex')
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

// ── ADMIN LEADS (sales pipeline view) ────────────────────────────────────────
//
// A "lead" is any quote request from a customer — guest or registered. This
// endpoint returns every quote_request joined with the originating customer's
// contact info, plus computed fields the Leads UI needs:
//   status_key  — normalized to 'new' | 'quoted' | 'confirmed' | 'lost'
//   hot         — needs follow-up (created <24h ago, no bid yet, still open)
//   bid_count   — how many bids exist for this lead
//   minutes_since_created
//
// Reuses the existing admin auth — no new role.
function leadsHotFlag(qr, bids) {
  if (qr.lost_reason || qr.status === 'lost') return false
  if (['confirmed', 'booked', 'completed'].includes(qr.status)) return false
  if (bids.length > 0) return false
  const ageMs = Date.now() - Date.parse(qr.created_at || 0)
  return ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000
}

function leadStatusKey(qr, bids) {
  if (qr.lost_reason || qr.status === 'lost') return 'lost'
  if (['confirmed', 'booked', 'completed'].includes(qr.status)) return 'confirmed'
  if (bids.length > 0 || qr.status === 'quoted' || qr.status === 'contacted') return 'quoted'
  return 'new'
}

function enrichLead(qr) {
  const bids = db.getBidsForRequest(qr.id)
  const customer = qr.customer_id ? db.getUser(qr.customer_id) : null
  const createdMs = Date.parse(qr.created_at || 0)
  return {
    ...qrToLead(qr),
    // Prefer the registered user's profile contact info when available, fall
    // back to the values captured on the guest quote form.
    name:  customer?.name  || qr.customer_name  || qr.name  || 'Guest',
    email: customer?.email || qr.customer_email || qr.email || '',
    phone: customer?.phone || qr.customer_phone || qr.phone || '',
    bids,
    bid_count: bids.length,
    status_key: leadStatusKey(qr, bids),
    hot: leadsHotFlag(qr, bids),
    minutes_since_created: Number.isFinite(createdMs)
      ? Math.max(0, Math.floor((Date.now() - createdMs) / 60000))
      : 0,
    admin_notes: qr.admin_notes || '',
    lost_reason: qr.lost_reason || '',
    lost_at: qr.lost_at || null,
  }
}

app.get('/api/admin/leads', auth, role('admin', 'operator'), (req, res) => {
  try {
    const { search, status, hot } = req.query
    // Enrich every quote request once; both the filtered list and the
    // sidebar-badge counts are derived from the same snapshot.
    const all = db.listQuoteRequests().map(enrichLead)
    let list = all

    if (status && status !== 'all') {
      list = list.filter(l => l.status_key === status)
    }
    if (hot === '1' || hot === 'true') {
      list = list.filter(l => l.hot)
    }
    if (search) {
      const s = String(search).toLowerCase()
      list = list.filter(l =>
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s) ||
        l.pickup?.toLowerCase().includes(s) ||
        l.dropoff?.toLowerCase().includes(s)
      )
    }

    res.json({
      data: list,
      counts: {
        total: all.length,
        new: all.filter(l => l.status_key === 'new').length,
        quoted: all.filter(l => l.status_key === 'quoted').length,
        confirmed: all.filter(l => l.status_key === 'confirmed').length,
        lost: all.filter(l => l.status_key === 'lost').length,
        hot: all.filter(l => l.hot).length,
      },
      server_time: new Date().toISOString(),
    })
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch leads', error: e.message })
  }
})

// Update an admin's freeform notes on a lead.
app.patch('/api/admin/leads/:id/notes', auth, role('admin', 'operator'), (req, res) => {
  try {
    const { admin_notes } = req.body
    if (typeof admin_notes !== 'string') {
      return res.status(400).json({ message: 'admin_notes must be a string' })
    }
    const updated = db.updateQuoteRequest(req.params.id, {
      admin_notes: admin_notes.slice(0, 4000),
    })
    if (!updated) return res.status(404).json({ message: 'Lead not found' })
    res.json({ success: true, data: enrichLead(updated) })
  } catch (e) {
    res.status(500).json({ message: 'Could not save notes', error: e.message })
  }
})

// Mark a lead as Lost (with optional free-text reason). Hidden from default
// view but retained for search and historical reporting.
app.post('/api/admin/leads/:id/lose', auth, role('admin', 'operator'), (req, res) => {
  try {
    const qr = db.getQuoteRequest(req.params.id)
    if (!qr) return res.status(404).json({ message: 'Lead not found' })
    if (['confirmed', 'booked', 'completed'].includes(qr.status)) {
      return res.status(409).json({ message: `This lead is already ${qr.status} and cannot be marked lost` })
    }
    const reason = String(req.body?.reason || '').slice(0, 500)
    const updated = db.updateQuoteRequest(qr.id, {
      status: 'lost',
      lost_reason: reason,
      lost_at: new Date().toISOString(),
    })
    res.json({ success: true, data: enrichLead(updated) })
  } catch (e) {
    res.status(500).json({ message: 'Could not mark lead as lost', error: e.message })
  }
})

// Reopen a lead that was previously marked Lost.
app.post('/api/admin/leads/:id/reopen', auth, role('admin', 'operator'), (req, res) => {
  try {
    const qr = db.getQuoteRequest(req.params.id)
    if (!qr) return res.status(404).json({ message: 'Lead not found' })
    if (qr.status !== 'lost' && !qr.lost_reason) {
      return res.status(409).json({ message: 'This lead is not in the Lost state' })
    }
    // Restore to 'quoted' if there are existing bids, otherwise back to 'pending'
    const bids = db.getBidsForRequest(qr.id)
    const nextStatus = bids.length > 0 ? 'quoted' : 'pending'
    const updated = db.updateQuoteRequest(qr.id, {
      status: nextStatus,
      lost_reason: '',
      lost_at: null,
    })
    res.json({ success: true, data: enrichLead(updated) })
  } catch (e) {
    res.status(500).json({ message: 'Could not reopen lead', error: e.message })
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

// ── LIVE CHAT ────────────────────────────────────────────────────────────────
//
// Visitor ↔ admin live chat. The transport is Socket.IO (set up at the bottom
// of this file alongside the HTTP server). The REST endpoints below cover:
//   • image uploads (multer) — broadcast as URL-only chat messages
//   • initial fetch of session list + transcripts when a page first loads,
//     before the socket has caught the user up.

db.ensureChatStores()

// Uploads live next to the JSON store. Served as static files at /uploads.
const UPLOADS_DIR = join(__dirname, 'uploads')
const CHAT_UPLOADS_DIR = join(UPLOADS_DIR, 'chat')
mkdirSync(CHAT_UPLOADS_DIR, { recursive: true })
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }))

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

// We use *memory* storage so the file never touches disk until the request is
// fully authenticated and rate-limit checked. This eliminates the "fill disk
// with anonymous junk" attack vector that disk-storage would expose.
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'))
    }
    cb(null, true)
  },
})

// Per-session upload rate limit (sliding window of 1 minute, 10 uploads max).
// In-memory only; resets on server restart.
const UPLOAD_LIMIT_PER_MIN = 10
const uploadHits = new Map() // key -> [timestamp, ...]
function rateLimitUpload(key) {
  const now = Date.now()
  const hits = (uploadHits.get(key) || []).filter(ts => now - ts < 60_000)
  if (hits.length >= UPLOAD_LIMIT_PER_MIN) return false
  hits.push(now)
  uploadHits.set(key, hits)
  // Periodic GC: trim the map every so often when it gets large.
  if (uploadHits.size > 5000) {
    for (const [k, arr] of uploadHits) {
      const fresh = arr.filter(ts => now - ts < 60_000)
      if (fresh.length === 0) uploadHits.delete(k)
      else uploadHits.set(k, fresh)
    }
  }
  return true
}

// POST /api/chat/upload — multipart form, single field "file".
// Auth: must come from either an admin/operator JWT in `Authorization`, OR
// from a visitor presenting a valid signed chat token (`chat_token` form
// field) whose session_id matches the `session_id` form field.
//
// Order of operations matters: multer reads the file into MEMORY (not disk),
// then we authenticate, then we rate-limit, then we finally persist. This
// guarantees that an unauthenticated request never produces a file on disk.
app.post('/api/chat/upload', (req, res) => {
  chatUpload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5 MB or smaller'
        : err.message || 'Upload failed'
      return res.status(400).json({ message: msg })
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const session_id = clean(req.body?.session_id, 80)
    const tokenHeader = req.headers.authorization
    let isStaff = false
    if (tokenHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(tokenHeader.slice(7), JWT_SECRET)
        isStaff = ['admin', 'operator'].includes(decoded?.role)
      } catch {}
    }

    if (!isStaff) {
      const chatToken = verifyChatToken(req.body?.chat_token)
      if (!chatToken || !session_id || chatToken.session_id !== session_id) {
        return res.status(401).json({ message: 'Chat session token required' })
      }
    } else if (!session_id) {
      return res.status(400).json({ message: 'session_id required' })
    }

    const rateKey = isStaff ? `admin:${tokenHeader}` : `visitor:${session_id}`
    if (!rateLimitUpload(rateKey)) {
      return res.status(429).json({ message: 'Too many uploads — slow down' })
    }

    // Auth + rate-limit cleared — now (and only now) flush to disk.
    const safeExt = (extname(req.file.originalname || '').toLowerCase()
      .match(/\.(jpg|jpeg|png|webp|gif)$/)?.[0]) || '.jpg'
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${safeExt}`
    try {
      writeFileSync(join(CHAT_UPLOADS_DIR, filename), req.file.buffer)
    } catch (e) {
      return res.status(500).json({ message: 'Could not save image' })
    }

    res.json({
      success: true,
      url: `/uploads/chat/${filename}`,
      bytes: req.file.size,
      mime: req.file.mimetype,
    })
  })
})

// Admin-only: list every chat session (active + ended), newest first.
// Used to render the visitor list and the archive view.
app.get('/api/chat/sessions', auth, role('admin', 'operator'), (_req, res) => {
  try {
    // `presence` and `publicSession` are defined further down the file, in the
    // Socket.IO section. They're already initialised by the time any HTTP
    // request can hit this handler.
    const sessions = db.listChatSessions().map(s => ({
      ...publicSession(s),
      message_count: db.listChatMessages(s.id).length,
    }))
    const online_count = sessions.filter(s => s.online).length
    res.json({ data: sessions, online_count })
  } catch (e) {
    res.status(500).json({ message: 'Could not load chat sessions', error: e.message })
  }
})

// Fetch the full transcript for a session.
// Admin/operator: any session via Authorization JWT.
// Visitor: must present a signed `chat_token` (query param) whose session_id
// matches the one on the requested chat row. Self-asserted session ids are
// rejected — only the server-issued token grants access.
app.get('/api/chat/sessions/:id/messages', (req, res) => {
  try {
    const session = db.getChatSession(req.params.id)
    if (!session) return res.status(404).json({ message: 'Chat not found' })

    const tokenHeader = req.headers.authorization
    let isStaff = false
    if (tokenHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(tokenHeader.slice(7), JWT_SECRET)
        isStaff = ['admin', 'operator'].includes(decoded?.role)
      } catch {}
    }
    if (!isStaff) {
      const chatToken = verifyChatToken(req.query.chat_token)
      if (!chatToken || chatToken.session_id !== session.session_id) {
        return res.status(403).json({ message: 'Not allowed to view this transcript' })
      }
    }
    res.json({ data: db.listChatMessages(session.id) })
  } catch (e) {
    res.status(500).json({ message: 'Could not load messages', error: e.message })
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

// ── SOCKET.IO LIVE CHAT ──────────────────────────────────────────────────────
//
// Two kinds of connections share the same Socket.IO server:
//   • Visitors  — anonymous, identified by a stable `session_id` they persist
//     in localStorage. Each visitor is placed in their own room
//     `chat:<session_id>` so admins who join that room receive their messages.
//   • Admins    — authenticated via a JWT they pass when emitting
//     `admin:hello`. Every admin socket joins the `admins` room and gets
//     broadcast presence + new-message pings for *every* session, then opts
//     into a specific session via `admin:join-session`.
//
// We track active visitors in memory (Map<session_id, presence>) so the
// admin's "who's online right now" panel updates in real time without
// hitting disk on every heartbeat. The persistent JSON store still holds the
// transcript and the session metadata for archive search.

const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: true, credentials: true },
  // Visitor uploads are 5 MB; everything else is small JSON.
  maxHttpBufferSize: 6 * 1024 * 1024,
})

const ADMIN_ROOM = 'admins'
const presence = new Map() // session_id -> { socket_ids:Set, last_seen, page_url, name, email, customer_id }

// Hard caps so an attacker spinning up sockets/sessions can't OOM the server.
const MAX_PRESENCE_ENTRIES   = 5000   // distinct visitor sessions tracked at once
const MAX_SOCKETS_PER_SESSION = 5     // a single visitor opening many tabs
const PRESENCE_CLEANUP_MS     = 5000  // grace period for navigations
const cleanupTimers = new Map()       // session_id -> Timeout (so we can dedupe)

// Field-length limits applied before storage/broadcast.
const MAX_NAME       = 80
const MAX_EMAIL      = 200
const MAX_PAGE_URL   = 500
const MAX_BODY       = 4000

function evictOldestPresenceIfNeeded() {
  if (presence.size < MAX_PRESENCE_ENTRIES) return
  let oldestKey = null
  let oldestTs = Infinity
  for (const [k, v] of presence) {
    if (v.last_seen < oldestTs) { oldestTs = v.last_seen; oldestKey = k }
  }
  if (oldestKey) presence.delete(oldestKey)
}

function publicSession(row) {
  if (!row) return null
  const live = presence.get(row.session_id)
  return {
    ...row,
    online: !!live,
    page_url: live?.page_url || row.page_url || '',
    last_seen: live?.last_seen || row.last_seen || row.updated_at || row.started_at,
  }
}

function broadcastSessionUpdate(session_id) {
  const row = db.getChatSessionByKey(session_id)
  if (!row) return
  io.to(ADMIN_ROOM).emit('chat:session-update', publicSession(row))
}

// Returns true if the socket was added; false if the per-session cap is hit.
function visitorJoinedPresence(socket, session_id, info = {}) {
  let entry = presence.get(session_id)
  if (!entry) {
    evictOldestPresenceIfNeeded()
    entry = {
      socket_ids: new Set(),
      last_seen: Date.now(),
      page_url: info.page_url || '',
      name: info.name || '',
      email: info.email || '',
      customer_id: info.customer_id || null,
    }
    presence.set(session_id, entry)
  }
  if (entry.socket_ids.size >= MAX_SOCKETS_PER_SESSION && !entry.socket_ids.has(socket.id)) {
    return false
  }
  entry.socket_ids.add(socket.id)
  entry.last_seen = Date.now()
  if (info.page_url) entry.page_url = info.page_url
  if (info.name)     entry.name     = info.name
  if (info.email)    entry.email    = info.email
  if (info.customer_id) entry.customer_id = info.customer_id
  // Cancel any pending cleanup since we're online again.
  const t = cleanupTimers.get(session_id)
  if (t) { clearTimeout(t); cleanupTimers.delete(session_id) }
  return true
}

function visitorLeftPresence(socket, session_id) {
  const entry = presence.get(session_id)
  if (!entry) return
  entry.socket_ids.delete(socket.id)
  if (entry.socket_ids.size === 0 && !cleanupTimers.has(session_id)) {
    // Single deduped grace timer per session — prevents timer amplification
    // under churn.
    const t = setTimeout(() => {
      cleanupTimers.delete(session_id)
      const cur = presence.get(session_id)
      if (cur && cur.socket_ids.size === 0) {
        presence.delete(session_id)
        broadcastSessionUpdate(session_id)
      }
    }, PRESENCE_CLEANUP_MS)
    cleanupTimers.set(session_id, t)
  }
}

function persistMessageAndBroadcast({ session_id, sender_kind, sender_id, sender_name, body, image_url }) {
  const row = db.getChatSessionByKey(session_id)
  if (!row) return null
  const msg = db.appendChatMessage({
    chat_session_id: row.id,
    session_id,
    sender_kind,
    sender_id: sender_id || null,
    sender_name: sender_name || (sender_kind === 'admin' ? 'Agent' : 'Visitor'),
    body: body ? String(body).slice(0, 4000) : '',
    image_url: image_url || '',
  })
  db.upsertChatSession(session_id, {
    last_seen: new Date().toISOString(),
    last_message_preview: image_url ? '📷 Image' : (body || '').slice(0, 120),
    last_message_kind: sender_kind,
    has_admin_replied: row.has_admin_replied || sender_kind === 'admin',
  })
  io.to(`chat:${session_id}`).emit('chat:message', msg)
  // Notify all admins listening to the visitor list, even those who haven't
  // joined this specific session yet, so the row reorders/updates instantly.
  io.to(ADMIN_ROOM).emit('chat:message-preview', { session_id, message: msg })
  broadcastSessionUpdate(session_id)
  return msg
}

io.on('connection', (socket) => {
  // Each socket starts as "unidentified" — we attach `visitor` or `admin`
  // metadata once it announces itself with a hello event.
  socket.data.visitor = null
  socket.data.admin = null

  // ── Visitor lifecycle ──────────────────────────────────────────────────
  //
  // The first time a visitor connects they have no chat token. We mint a fresh
  // session_id + signed token server-side and ship it back via `chat:identity`
  // so the client can persist both. On reconnects the client sends the token;
  // we verify it and trust the embedded session_id (the client's own
  // session_id field is ignored if the token is present).
  socket.on('visitor:hello', (payload = {}) => {
    const verified = verifyChatToken(payload.chat_token)
    let session_id = verified?.session_id || null
    let chat_token = verified ? payload.chat_token : null

    if (!session_id) {
      session_id = newVisitorSessionId()
      chat_token = signChatToken(session_id)
    }

    const accepted = visitorJoinedPresence(socket, session_id, {
      page_url: clean(payload.page_url, MAX_PAGE_URL),
    })
    if (!accepted) {
      socket.emit('chat:auth-error', { message: 'Too many connections from this session' })
      return
    }

    socket.data.visitor = { session_id }
    socket.join(`chat:${session_id}`)

    // Optionally tie this chat to a logged-in customer for follow-up.
    let customer_id = null
    let name  = clean(payload.name, MAX_NAME)
    let email = clean(payload.email, MAX_EMAIL)
    if (payload.token) {
      try {
        const decoded = jwt.verify(payload.token, JWT_SECRET)
        if (decoded && decoded.role === 'customer') {
          customer_id = decoded.id
          const u = db.getUser(decoded.id)
          if (u) { name = u.name; email = u.email }
        }
      } catch {}
    }

    const existing = db.getChatSessionByKey(session_id)
    db.upsertChatSession(session_id, {
      name:        name  || existing?.name  || '',
      email:       email || existing?.email || '',
      customer_id: customer_id || existing?.customer_id || null,
      page_url:    clean(payload.page_url, MAX_PAGE_URL) || existing?.page_url || '',
      last_seen:   new Date().toISOString(),
      status:      'active',
    })
    broadcastSessionUpdate(session_id)

    // Identity goes out FIRST so the client persists the token before sending
    // any messages.
    socket.emit('chat:identity', { session_id, chat_token })

    const row = db.getChatSessionByKey(session_id)
    socket.emit('chat:hello', {
      session: publicSession(row),
      messages: db.listChatMessages(row.id),
    })
  })

  socket.on('visitor:heartbeat', (payload = {}) => {
    const v = socket.data.visitor
    if (!v) return
    const entry = presence.get(v.session_id)
    const url = clean(payload.page_url, MAX_PAGE_URL)
    if (entry) {
      entry.last_seen = Date.now()
      if (url) entry.page_url = url
    }
    if (url) {
      db.upsertChatSession(v.session_id, { page_url: url, last_seen: new Date().toISOString() })
    }
    broadcastSessionUpdate(v.session_id)
  })

  socket.on('visitor:typing', (payload = {}) => {
    const v = socket.data.visitor
    if (!v) return
    io.to(`chat:${v.session_id}`).emit('chat:typing', { kind: 'visitor', is_typing: !!payload.is_typing, session_id: v.session_id })
  })

  socket.on('visitor:message', (payload = {}) => {
    const v = socket.data.visitor
    if (!v) return
    const body      = clean(payload.body, MAX_BODY)
    const image_url = clean(payload.image_url, 500)
    if (!body && !image_url) return
    // Image URLs we accept must come from our own uploads endpoint.
    if (image_url && !image_url.startsWith('/uploads/chat/')) return
    const session = db.getChatSessionByKey(v.session_id)
    persistMessageAndBroadcast({
      session_id: v.session_id,
      sender_kind: 'visitor',
      sender_id: session?.customer_id || null,
      sender_name: clean(payload.name, MAX_NAME) || session?.name || 'Visitor',
      body,
      image_url,
    })
  })

  // ── Admin lifecycle ────────────────────────────────────────────────────
  socket.on('admin:hello', (payload = {}) => {
    let decoded = null
    try { decoded = jwt.verify(payload.token || '', JWT_SECRET) } catch {}
    if (!decoded || !['admin', 'operator'].includes(decoded.role)) {
      socket.emit('chat:auth-error', { message: 'Admin auth required' })
      return
    }
    const user = db.getUser(decoded.id)
    socket.data.admin = { id: decoded.id, name: user?.name || 'Agent', role: decoded.role }
    socket.join(ADMIN_ROOM)

    // Initial snapshot
    socket.emit('chat:snapshot', {
      sessions: db.listChatSessions().map(publicSession),
    })
  })

  socket.on('admin:join-session', (payload = {}) => {
    if (!socket.data.admin) return
    const session_id = clean(payload.session_id, 80)
    if (!session_id) return
    socket.join(`chat:${session_id}`)
    const row = db.getChatSessionByKey(session_id)
    if (row) {
      socket.emit('chat:transcript', {
        session_id,
        messages: db.listChatMessages(row.id),
      })
    }
  })

  socket.on('admin:leave-session', (payload = {}) => {
    if (!socket.data.admin) return
    const session_id = clean(payload.session_id, 80)
    if (session_id) socket.leave(`chat:${session_id}`)
  })

  socket.on('admin:typing', (payload = {}) => {
    if (!socket.data.admin) return
    const session_id = clean(payload.session_id, 80)
    if (!session_id) return
    io.to(`chat:${session_id}`).emit('chat:typing', {
      kind: 'admin', is_typing: !!payload.is_typing, session_id,
      admin_name: socket.data.admin.name,
    })
  })

  socket.on('admin:message', (payload = {}) => {
    if (!socket.data.admin) return
    const session_id = clean(payload.session_id, 80)
    const body      = clean(payload.body, MAX_BODY)
    const image_url = clean(payload.image_url, 500)
    if (!session_id || (!body && !image_url)) return
    if (image_url && !image_url.startsWith('/uploads/chat/')) return
    // Auto-create the session if the admin proactively starts a chat with a
    // visitor who's only been pinging via heartbeat (no prior message yet).
    if (!db.getChatSessionByKey(session_id)) {
      db.upsertChatSession(session_id, {
        name: clean(payload.visitor_name, MAX_NAME),
        page_url: clean(payload.page_url, MAX_PAGE_URL),
        last_seen: new Date().toISOString(),
        status: 'active',
      })
    }
    persistMessageAndBroadcast({
      session_id,
      sender_kind: 'admin',
      sender_id: socket.data.admin.id,
      sender_name: socket.data.admin.name,
      body,
      image_url,
    })
  })

  socket.on('admin:end-session', (payload = {}) => {
    if (!socket.data.admin) return
    const session_id = clean(payload.session_id, 80)
    const row = db.getChatSessionByKey(session_id)
    if (!row) return
    db.endChatSession(row.id)
    io.to(`chat:${session_id}`).emit('chat:ended', { session_id })
    broadcastSessionUpdate(session_id)
  })

  socket.on('disconnect', () => {
    if (socket.data.visitor) {
      visitorLeftPresence(socket, socket.data.visitor.session_id)
    }
  })
})

// ── START ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[API] Server running on port ${PORT}`)
  console.log(`[API] Serving frontend from: ${DIST}`)
  console.log(`[API] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
  console.log(`[API] Socket.IO chat enabled`)
})
