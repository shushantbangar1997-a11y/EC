import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_FILE = join(DATA_DIR, 'db.json')

mkdirSync(DATA_DIR, { recursive: true })

function load() {
  if (!existsSync(DB_FILE)) return null
  try { return JSON.parse(readFileSync(DB_FILE, 'utf8')) } catch { return null }
}

function save(data) {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

function seed() {
  const adminHash = bcrypt.hashSync('Admin@1313', 10)
  const opHash = bcrypt.hashSync('operator123', 10)
  const custHash = bcrypt.hashSync('customer123', 10)
  const initial = {
    users: [
      { id: 'u1', name: 'Admin', email: 'admin@everywherecars.com', password: adminHash, phone: '+17186586000', role: 'admin', created_at: new Date().toISOString() },
      { id: 'u2', name: 'EC Operator', email: 'operator@everywherecars.com', password: opHash, phone: '+17186586001', role: 'operator', created_at: new Date().toISOString() },
      { id: 'u3', name: 'Demo Customer', email: 'customer@test.com', password: custHash, phone: '+12125550001', role: 'customer', created_at: new Date().toISOString() },
    ],
    quote_requests: [],
    bids: [],
    bid_messages: [],
    chat_sessions: [],
    chat_messages: [],
    drivers: [
      { id: 'd1', operator_id: 'u2', name: 'James Carter', phone: '+17185550001', vehicle_type: 'sedan', vehicle: 'Lincoln Town Car', plate: 'NYC-1234', status: 'available', created_at: new Date().toISOString() },
      { id: 'd2', operator_id: 'u2', name: 'Maria Santos', phone: '+17185550002', vehicle_type: 'suv', vehicle: 'Cadillac Escalade', plate: 'NYC-5678', status: 'available', created_at: new Date().toISOString() },
      { id: 'd3', operator_id: 'u2', name: 'Kevin Brown', phone: '+17185550003', vehicle_type: 'sprinter_van', vehicle: 'Mercedes Sprinter', plate: 'NYC-9012', status: 'on_trip', created_at: new Date().toISOString() },
    ],
    _nextId: 100,
  }
  save(initial)
  return initial
}

let _db = load() || seed()

function nextId() {
  _db._nextId = (_db._nextId || 100) + 1
  save(_db)
  return String(_db._nextId)
}

export const db = {
  getUser: (id) => _db.users.find(u => u.id === id) || null,
  getUserByEmail: (email) => _db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null,
  createUser: (data) => {
    const user = { id: nextId(), created_at: new Date().toISOString(), ...data }
    _db.users.push(user)
    save(_db)
    return user
  },
  listUsers: () => _db.users,

  createQuoteRequest: (data) => {
    const quote_token = randomBytes(18).toString('hex')
    const qr = { id: nextId(), status: 'pending', quote_token, created_at: new Date().toISOString(), ...data }
    _db.quote_requests.push(qr)
    save(_db)
    return qr
  },
  getQuoteRequest: (id) => _db.quote_requests.find(q => q.id === id) || null,
  listQuoteRequests: (filters = {}) => {
    let list = [..._db.quote_requests].reverse()
    if (filters.status && filters.status !== 'all') list = list.filter(q => q.status === filters.status)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      list = list.filter(q => q.pickup?.toLowerCase().includes(s) || q.dropoff?.toLowerCase().includes(s) || q.customer_name?.toLowerCase().includes(s))
    }
    return list
  },
  updateQuoteRequest: (id, updates) => {
    const idx = _db.quote_requests.findIndex(q => q.id === id)
    if (idx === -1) return null
    _db.quote_requests[idx] = { ..._db.quote_requests[idx], ...updates, updated_at: new Date().toISOString() }
    save(_db)
    return _db.quote_requests[idx]
  },

  createBid: (data) => {
    const bid = { id: nextId(), status: 'pending', created_at: new Date().toISOString(), ...data }
    _db.bids.push(bid)
    save(_db)
    return bid
  },
  getBid: (id) => _db.bids.find(b => b.id === id) || null,
  getBidsForRequest: (quote_request_id) => _db.bids.filter(b => b.quote_request_id === quote_request_id),
  listBids: (filters = {}) => {
    let list = [..._db.bids].reverse()
    if (filters.operator_id) list = list.filter(b => b.operator_id === filters.operator_id)
    if (filters.status && filters.status !== 'all') list = list.filter(b => (b.status || 'pending') === filters.status)
    return list
  },
  updateBid: (id, updates) => {
    const idx = _db.bids.findIndex(b => b.id === id)
    if (idx === -1) return null
    _db.bids[idx] = { ..._db.bids[idx], ...updates, updated_at: new Date().toISOString() }
    save(_db)
    return _db.bids[idx]
  },
  deleteBid: (id) => {
    const idx = _db.bids.findIndex(b => b.id === id)
    if (idx === -1) return false
    _db.bids.splice(idx, 1)
    if (Array.isArray(_db.bid_messages)) {
      _db.bid_messages = _db.bid_messages.filter(m => m.bid_id !== id)
    }
    save(_db)
    return true
  },

  createBidMessage: (data) => {
    if (!Array.isArray(_db.bid_messages)) _db.bid_messages = []
    const msg = { id: nextId(), created_at: new Date().toISOString(), ...data }
    _db.bid_messages.push(msg)
    save(_db)
    return msg
  },
  listBidMessages: (bid_id) => {
    if (!Array.isArray(_db.bid_messages)) return []
    return _db.bid_messages.filter(m => m.bid_id === bid_id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  },

  // ── CHAT (visitor ↔ admin live chat) ────────────────────────────────────
  // chat_sessions store one row per visitor session_id (the stable token the
  // client persists in localStorage). We retain the session forever so the
  // admin can search transcripts and a returning visitor sees their history.
  ensureChatStores: () => {
    if (!Array.isArray(_db.chat_sessions)) _db.chat_sessions = []
    if (!Array.isArray(_db.chat_messages)) _db.chat_messages = []
  },
  getChatSessionByKey: (session_id) => {
    if (!Array.isArray(_db.chat_sessions)) return null
    return _db.chat_sessions.find(s => s.session_id === session_id) || null
  },
  getChatSession: (id) => {
    if (!Array.isArray(_db.chat_sessions)) return null
    return _db.chat_sessions.find(s => s.id === id) || null
  },
  upsertChatSession: (session_id, updates) => {
    if (!Array.isArray(_db.chat_sessions)) _db.chat_sessions = []
    const idx = _db.chat_sessions.findIndex(s => s.session_id === session_id)
    if (idx === -1) {
      const row = {
        id: nextId(),
        session_id,
        status: 'active',
        started_at: new Date().toISOString(),
        ...updates,
      }
      _db.chat_sessions.push(row)
      save(_db)
      return row
    }
    _db.chat_sessions[idx] = {
      ..._db.chat_sessions[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    save(_db)
    return _db.chat_sessions[idx]
  },
  listChatSessions: () => {
    if (!Array.isArray(_db.chat_sessions)) return []
    return [..._db.chat_sessions].sort(
      (a, b) => new Date(b.last_seen || b.updated_at || b.started_at) - new Date(a.last_seen || a.updated_at || a.started_at)
    )
  },
  appendChatMessage: (data) => {
    if (!Array.isArray(_db.chat_messages)) _db.chat_messages = []
    const msg = {
      id: nextId(),
      created_at: new Date().toISOString(),
      ...data,
    }
    _db.chat_messages.push(msg)
    save(_db)
    return msg
  },
  listChatMessages: (chat_session_id) => {
    if (!Array.isArray(_db.chat_messages)) return []
    return _db.chat_messages
      .filter(m => m.chat_session_id === chat_session_id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  },
  endChatSession: (id, ended_at) => {
    if (!Array.isArray(_db.chat_sessions)) return null
    const idx = _db.chat_sessions.findIndex(s => s.id === id)
    if (idx === -1) return null
    _db.chat_sessions[idx] = {
      ..._db.chat_sessions[idx],
      status: 'ended',
      ended_at: ended_at || new Date().toISOString(),
    }
    save(_db)
    return _db.chat_sessions[idx]
  },

  listDrivers: (operator_id) => operator_id ? _db.drivers.filter(d => d.operator_id === operator_id) : _db.drivers,
  createDriver: (data) => {
    const d = { id: nextId(), created_at: new Date().toISOString(), ...data }
    _db.drivers.push(d)
    save(_db)
    return d
  },
}
