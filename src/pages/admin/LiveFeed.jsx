import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  FiZap, FiMapPin, FiNavigation2, FiUsers, FiTruck, FiClock,
  FiDollarSign, FiSend, FiChevronDown, FiChevronUp, FiFilter,
  FiAlertTriangle, FiRefreshCw, FiInbox, FiCheckCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../utils/api'

const NAVY_DEEP = '#0a1628'
const GOLD      = '#F6C90E'
const ELECTRIC  = '#0EA5E9'

const URGENCY = {
  Critical: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', score: 4, icon: '🔴' },
  Soon:     { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', score: 3, icon: '🟡' },
  Today:    { color: ELECTRIC,  bg: '#f0f9ff', border: '#bae6fd', score: 2, icon: '🔵' },
  Flexible: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', score: 1, icon: '🟢' },
  ASAP:     { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', score: 0, icon: '⚫' },
}

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

// Short browser chime via Web Audio API
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
    setTimeout(() => ctx.close(), 600)
  } catch {}
}

// ── Quick-bid inline form ────────────────────────────────────────────────────

function QuickBid({ order, onDone, onFlash }) {
  const [price, setPrice]   = useState('')
  const [eta, setEta]       = useState(30)
  const [vehicle, setVehicle] = useState(order.vehicle_type || 'sedan')
  const [msg, setMsg]       = useState('')
  const [busy, setBusy]     = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const n = Number(price)
    if (!n || n <= 0) { toast.error('Enter a valid price'); return }
    setBusy(true)
    try {
      await api.post(`/quote-requests/${order.id}/bids`, {
        price: n, vehicle_type: vehicle,
        eta_minutes: Number(eta) || 30, message: msg,
      })
      toast.success('Offer sent!', { icon: '🚖', style: { background: NAVY_DEEP, color: '#fff', border: `1px solid ${GOLD}` } })
      onFlash?.()
      onDone?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 14, padding: '14px 16px',
        background: '#f8fafc', borderRadius: 10,
        border: `1px solid #e5e7eb`,
        animation: 'slideDown 0.18s ease',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Price (USD)</label>
          <div style={{ position: 'relative' }}>
            <FiDollarSign size={12} style={{ position: 'absolute', left: 9, top: 10, color: '#94a3b8' }} />
            <input
              type="number" min="1" step="1" required
              value={price} onChange={e => setPrice(e.target.value)}
              placeholder="120"
              style={{ ...inputStyle, paddingLeft: 26, fontWeight: 700, fontSize: 16, border: `2px solid ${price ? GOLD : '#e5e7eb'}` }}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Vehicle</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} style={inputStyle}>
            {Object.entries(VEHICLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>ETA (min)</label>
          <input
            type="number" min="5" max="240"
            value={eta} onChange={e => setEta(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text" value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="Optional message to customer…"
          maxLength={140}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="submit" disabled={busy || !price}
          style={{
            padding: '9px 18px',
            background: busy || !price ? '#cbd5e1' : `linear-gradient(135deg, ${GOLD}, #d4a90c)`,
            color: NAVY_DEEP, border: 'none', borderRadius: 8,
            fontWeight: 800, fontSize: 13, cursor: busy || !price ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            boxShadow: busy || !price ? 'none' : `0 3px 10px rgba(246,201,14,0.35)`,
          }}
        >
          <FiSend size={13} />
          {busy ? 'Sending…' : 'Send Offer'}
        </button>
      </div>
    </form>
  )
}

const labelStyle = { fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }
const inputStyle = {
  width: '100%', padding: '9px 10px',
  border: '1px solid #e5e7eb', borderRadius: 8,
  fontSize: 13, color: NAVY_DEEP, outline: 'none',
  background: '#fff', boxSizing: 'border-box',
}

// ── Single feed card ─────────────────────────────────────────────────────────

function FeedCard({ order, myBid, isNew, criticalRef }) {
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState(isNew)
  const [bidFlash, setBidFlash] = useState(false)
  const u = URGENCY[order.urgency_label] || URGENCY.ASAP

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setFlash(false), 2200)
      return () => clearTimeout(t)
    }
  }, [isNew])

  const handleFlash = () => {
    setBidFlash(true)
    setTimeout(() => setBidFlash(false), 1200)
    setOpen(false)
  }

  const cardBorder = bidFlash ? GOLD : flash ? u.color : '#e5e7eb'
  const cardBg = bidFlash ? '#fffbeb' : flash ? u.bg : '#fff'

  return (
    <div
      ref={order.urgency_label === 'Critical' && !myBid ? criticalRef : null}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: `4px solid ${bidFlash ? GOLD : u.color}`,
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'background 0.4s, border-color 0.4s',
        animation: isNew ? 'slideIn 0.25s ease' : undefined,
        boxShadow: bidFlash ? `0 0 0 3px rgba(246,201,14,0.3)` : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Card header */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {/* Urgency badge */}
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
              background: u.bg, color: u.color, border: `1px solid ${u.border}`,
              textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {u.icon} {order.urgency_label}
            </span>
            {isNew && (
              <span style={{
                fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 999,
                background: u.color, color: '#fff', textTransform: 'uppercase',
                letterSpacing: 0.8, flexShrink: 0,
                animation: 'pulse 0.8s ease infinite',
              }}>NEW</span>
            )}
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>#{order.id}</span>
          </div>

          {/* Bid status pill */}
          {myBid ? (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
              background: '#dcfce7', color: '#166534',
              display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <FiCheckCircle size={11} /> You bid ${myBid.price}
            </span>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
              background: '#fef3c7', color: '#92400e',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              No bids yet
            </span>
          )}
        </div>

        {/* Customer name */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 7 }}>
          {order.name || order.customer_name || 'Guest'}
        </div>

        {/* Route */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: GOLD, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.pickup}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: ELECTRIC, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.dropoff}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FiUsers size={11} /> {order.passengers} pax
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FiTruck size={11} /> {VEHICLE_LABEL[order.vehicle_type] || order.vehicle_type}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FiClock size={11} />
            {order.ride_date
              ? format(new Date(order.ride_date), 'MMM d · h:mm a')
              : 'ASAP'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#cbd5e1' }}>
            Posted {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </span>
        </div>

        {order.notes && (
          <div style={{
            marginTop: 8, padding: '6px 10px',
            background: '#f1f5f9', borderRadius: 7,
            fontSize: 11, color: '#475569', fontStyle: 'italic',
            borderLeft: `2px solid ${ELECTRIC}`,
          }}>
            "{order.notes}"
          </div>
        )}
      </div>

      {/* Action row */}
      {!myBid && (
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              flex: 1, padding: '9px 14px',
              background: open ? '#f1f5f9' : `linear-gradient(135deg, ${GOLD}, #d4a90c)`,
              color: open ? '#475569' : NAVY_DEEP,
              border: open ? '1px solid #e5e7eb' : 'none',
              borderRadius: 8, fontWeight: 800, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: open ? 'none' : `0 3px 10px rgba(246,201,14,0.35)`,
            }}
          >
            {open ? <FiChevronUp size={13} /> : <FiZap size={13} />}
            {open ? 'Cancel' : 'Place Bid'}
          </button>
        </div>
      )}

      {/* Inline bid form */}
      {open && !myBid && (
        <div style={{ padding: '0 16px 16px' }}>
          <QuickBid order={order} onDone={() => setOpen(false)} onFlash={handleFlash} />
        </div>
      )}
    </div>
  )
}

// ── Urgency filter pills ──────────────────────────────────────────────────────

const ALL_TIERS = ['All', 'Critical', 'Soon', 'Today', 'Flexible', 'ASAP']
const ALL_VEHICLES = ['All', ...Object.keys(VEHICLE_LABEL)]

function FilterBar({ tier, setTier, veh, setVeh, openOnly, setOpenOnly }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '12px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
      <FiFilter size={13} color="#94a3b8" />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>Urgency</span>
      {ALL_TIERS.map(t => {
        const u = URGENCY[t]
        const active = tier === t
        return (
          <button
            key={t}
            onClick={() => setTier(t)}
            style={{
              padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: active ? (u ? u.color : NAVY_DEEP) : '#f1f5f9',
              color: active ? '#fff' : '#64748b',
              border: 'none', cursor: 'pointer',
            }}
          >{t === 'All' ? 'All' : `${u?.icon} ${t}`}</button>
        )
      })}
      <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 4px' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>Vehicle</span>
      {ALL_VEHICLES.map(v => (
        <button
          key={v}
          onClick={() => setVeh(v)}
          style={{
            padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: veh === v ? NAVY_DEEP : '#f1f5f9',
            color: veh === v ? '#fff' : '#64748b',
            border: 'none', cursor: 'pointer',
          }}
        >{v === 'All' ? 'All' : VEHICLE_LABEL[v]}</button>
      ))}
      <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 4px' }} />
      <button
        onClick={() => setOpenOnly(o => !o)}
        style={{
          padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: openOnly ? '#dcfce7' : '#f1f5f9',
          color: openOnly ? '#166534' : '#64748b',
          border: 'none', cursor: 'pointer',
        }}
      >
        {openOnly ? '✓ Unbid only' : 'Unbid only'}
      </button>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LiveFeed() {
  const [orders, setOrders] = useState([])
  const [myBids, setMyBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastPollIds, setLastPollIds] = useState(null)   // null = first load
  const [newIds, setNewIds] = useState(new Set())

  const [tier, setTier] = useState('All')
  const [veh, setVeh] = useState('All')
  const [openOnly, setOpenOnly] = useState(false)

  const criticalRef = useRef(null)
  const pollRef = useRef(null)

  const fetchData = useCallback(async (isFirst = false) => {
    try {
      const [ordersRes, bidsRes] = await Promise.all([
        api.get('/admin/orders', { params: { limit: 100 } }),
        api.get('/admin/my-bids'),
      ])
      const incoming = ordersRes.data?.data || []
      const bids = bidsRes.data?.data || []

      setMyBids(bids)
      setOrders(incoming)

      if (!isFirst && lastPollIds !== null) {
        const prevIds = lastPollIds
        const freshIds = new Set()
        incoming.forEach(o => { if (!prevIds.has(o.id)) freshIds.add(o.id) })
        if (freshIds.size > 0) {
          playChime()
          setNewIds(prev => new Set([...prev, ...freshIds]))
          setTimeout(() => setNewIds(prev => {
            const next = new Set(prev)
            freshIds.forEach(id => next.delete(id))
            return next
          }), 3000)
        }
      }

      setLastPollIds(new Set(incoming.map(o => o.id)))
    } catch {}
    finally { setLoading(false) }
  }, [lastPollIds])

  useEffect(() => {
    fetchData(true)
    pollRef.current = setInterval(() => fetchData(false), 2000)
    return () => clearInterval(pollRef.current)
  }, [])

  // Re-register interval when fetchData reference changes (lastPollIds updates)
  useEffect(() => {
    if (lastPollIds === null) return
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => fetchData(false), 2000)
    return () => clearInterval(pollRef.current)
  }, [fetchData])

  const myBidMap = useMemo(() => {
    const m = {}
    myBids.forEach(b => { m[b.quote_request_id] = b })
    return m
  }, [myBids])

  // Sort by urgency score desc, then oldest created_at first within same tier
  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ds = (b.urgency_score ?? 0) - (a.urgency_score ?? 0)
      if (ds !== 0) return ds
      return new Date(a.created_at) - new Date(b.created_at)
    })
  }, [orders])

  const filtered = useMemo(() => {
    return sorted.filter(o => {
      if (o.status === 'confirmed' || o.status === 'completed' || o.status === 'booked') return false
      if (tier !== 'All' && o.urgency_label !== tier) return false
      if (veh !== 'All' && o.vehicle_type !== veh) return false
      if (openOnly && myBidMap[o.id]) return false
      return true
    })
  }, [sorted, tier, veh, openOnly, myBidMap])

  const unbidCritical = useMemo(() =>
    filtered.filter(o => o.urgency_label === 'Critical' && !myBidMap[o.id]),
  [filtered, myBidMap])

  const scrollToCritical = () => {
    criticalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ padding: '20px 24px 0', background: '#f4f5f8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #d4a90c)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiZap size={17} color={NAVY_DEEP} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: NAVY_DEEP, margin: 0 }}>Live Feed</h1>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: '#22c55e', display: 'inline-block', animation: 'dot-pulse 1.5s ease infinite' }} />
                Auto-updating every 2 seconds · {filtered.length} open {filtered.length === 1 ? 'ride' : 'rides'}
              </div>
            </div>
          </div>

          {/* Bid All Critical shortcut */}
          {unbidCritical.length > 1 && (
            <button
              onClick={scrollToCritical}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 10,
                background: '#ef4444', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 800,
                boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                animation: 'pulse 1.2s ease infinite',
              }}
            >
              <FiAlertTriangle size={14} />
              {unbidCritical.length} Critical — Bid Now
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0 }}>
        <FilterBar tier={tier} setTier={setTier} veh={veh} setVeh={setVeh} openOnly={openOnly} setOpenOnly={setOpenOnly} />
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', background: '#f4f5f8' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: 60 }}>
            <FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p style={{ fontSize: 13, marginTop: 10 }}>Loading feed…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: 60 }}>
            <FiInbox size={40} style={{ opacity: 0.35, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No open rides match your filters</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>New requests will appear here automatically.</p>
          </div>
        )}

        {filtered.map(order => (
          <FeedCard
            key={order.id}
            order={order}
            myBid={myBidMap[order.id] || null}
            isNew={newIds.has(order.id)}
            criticalRef={criticalRef}
          />
        ))}
      </div>
    </div>
  )
}
