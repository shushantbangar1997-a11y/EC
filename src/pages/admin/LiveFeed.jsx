import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  FiZap, FiUsers, FiTruck, FiClock,
  FiDollarSign, FiSend, FiChevronDown, FiChevronUp, FiFilter,
  FiAlertTriangle, FiRefreshCw, FiInbox, FiCheckCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../utils/api'

// ── Design tokens ─────────────────────────────────────────────────────────────
const BK    = '#0a0a0a'
const WH    = '#ffffff'
const GR50  = '#fafafa'
const GR100 = '#f5f5f5'
const GR200 = '#e5e5e5'
const GR400 = '#a3a3a3'
const GR600 = '#525252'
const GR900 = '#171717'

// Urgency retains functional status colors (operational meaning)
const URGENCY = {
  Critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', score: 4, icon: '🔴' },
  Soon:     { color: '#d97706', bg: '#fffbeb', border: '#fde68a', score: 3, icon: '🟡' },
  Today:    { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', score: 2, icon: '🔵' },
  Flexible: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', score: 1, icon: '🟢' },
  ASAP:     { color: GR400,    bg: GR50,       border: GR200,     score: 0, icon: '⚫' },
}

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.18)
    setTimeout(() => ctx.close(), 400)
  } catch {}
}

// ── Shared input / label styles ───────────────────────────────────────────────
const labelStyle = {
  fontSize: 10, fontWeight: 600, color: GR400,
  display: 'block', marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: 0.8,
}
const inputStyle = {
  width: '100%', padding: '8px 10px',
  border: `1px solid ${GR200}`, borderRadius: 7,
  fontSize: 13, color: GR900, outline: 'none',
  background: WH, boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// ── Quick-bid inline form ─────────────────────────────────────────────────────
function QuickBid({ order, onDone, onFlash }) {
  const [price,   setPrice]   = useState('')
  const [eta,     setEta]     = useState(30)
  const [vehicle, setVehicle] = useState(order.vehicle_type || 'sedan')
  const [msg,     setMsg]     = useState('')
  const [busy,    setBusy]    = useState(false)

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
      toast.success('Offer sent!', {
        icon: '🚖',
        style: { background: BK, color: WH, border: `1px solid #1e1e1e`, borderRadius: 10, fontSize: 13 },
      })
      onFlash?.()
      onDone?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer')
    } finally { setBusy(false) }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 12, padding: '14px 16px',
        background: GR50, borderRadius: 9,
        border: `1px solid ${GR200}`,
        animation: 'slideDown 0.18s ease',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Price (USD)</label>
          <div style={{ position: 'relative' }}>
            <FiDollarSign size={11} style={{ position: 'absolute', left: 9, top: 10, color: GR400 }} />
            <input
              type="number" min="1" step="1" required
              value={price} onChange={e => setPrice(e.target.value)}
              placeholder="120"
              style={{ ...inputStyle, paddingLeft: 26, fontWeight: 700, fontSize: 15,
                border: `1px solid ${price ? GR900 : GR200}` }}
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
          placeholder="Optional note to customer…"
          maxLength={140}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="submit" disabled={busy || !price}
          style={{
            padding: '8px 16px',
            background: busy || !price ? GR200 : BK,
            color: busy || !price ? GR400 : WH,
            border: 'none', borderRadius: 7,
            fontWeight: 600, fontSize: 12, cursor: busy || !price ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
            letterSpacing: 0.2,
          }}
        >
          <FiSend size={12} />
          {busy ? 'Sending…' : 'Send Offer'}
        </button>
      </div>
    </form>
  )
}

// ── Single feed card ──────────────────────────────────────────────────────────
function FeedCard({ order, myBid, isNew, criticalRef, highlighted }) {
  const [open,     setOpen]     = useState(false)
  const [flash,    setFlash]    = useState(isNew)
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

  const cardBorder   = bidFlash ? GR900 : highlighted ? '#dc2626' : flash ? u.color : GR200
  const cardBg       = bidFlash ? GR100 : highlighted ? '#fef2f2' : flash ? u.bg : WH
  const leftAccent   = bidFlash ? GR900 : u.color

  return (
    <div
      ref={order.urgency_label === 'Critical' && !myBid ? criticalRef : null}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: `4px solid ${leftAccent}`,
        borderRadius: 11,
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'background 0.4s, border-color 0.4s',
        animation: isNew ? 'slideIn 0.25s ease' : undefined,
        boxShadow: bidFlash ? `0 0 0 3px rgba(10,10,10,0.12)` : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Card header */}
      <div style={{ padding: '13px 15px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
              background: u.bg, color: u.color, border: `1px solid ${u.border}`,
              textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {u.icon} {order.urgency_label}
            </span>
            {isNew && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                background: u.color, color: WH, textTransform: 'uppercase',
                letterSpacing: 0.8, flexShrink: 0,
                animation: 'pulse 0.8s ease infinite',
              }}>NEW</span>
            )}
            <span style={{ fontSize: 10, color: GR400, fontFamily: 'monospace', flexShrink: 0 }}>#{order.id}</span>
          </div>

          {myBid ? (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
              background: BK, color: WH,
              display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <FiCheckCircle size={11} /> You bid ${myBid.price}
            </span>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
              background: GR100, color: GR600, border: `1px solid ${GR200}`,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              No bids yet
            </span>
          )}
        </div>

        {/* Customer name */}
        <div style={{ fontSize: 12, fontWeight: 600, color: GR600, marginBottom: 7 }}>
          {order.name || order.customer_name || 'Guest'}
        </div>

        {/* Route */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: GR900, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: GR900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.pickup}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: GR400, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: GR600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.dropoff}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: GR400, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FiUsers size={11} /> {order.passengers} pax
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FiTruck size={11} /> {VEHICLE_LABEL[order.vehicle_type] || order.vehicle_type}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FiClock size={11} />
            {order.ride_date ? format(new Date(order.ride_date), 'MMM d · h:mm a') : 'ASAP'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: GR200 }}>
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </span>
        </div>

        {order.notes && (
          <div style={{
            marginTop: 8, padding: '6px 10px',
            background: GR50, borderRadius: 6,
            fontSize: 11, color: GR600, fontStyle: 'italic',
            borderLeft: `2px solid ${GR200}`,
          }}>
            "{order.notes}"
          </div>
        )}
      </div>

      {/* Action row */}
      {!myBid && (
        <div style={{ padding: '0 15px 13px', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              flex: 1, padding: '8px 14px',
              background: open ? GR100 : BK,
              color: open ? GR600 : WH,
              border: open ? `1px solid ${GR200}` : 'none',
              borderRadius: 7, fontWeight: 600, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              letterSpacing: 0.2,
            }}
          >
            {open ? <FiChevronUp size={12} /> : <FiZap size={12} />}
            {open ? 'Cancel' : 'Place Bid'}
          </button>
        </div>
      )}

      {open && !myBid && (
        <div style={{ padding: '0 15px 15px' }}>
          <QuickBid order={order} onDone={() => setOpen(false)} onFlash={handleFlash} />
        </div>
      )}
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
const ALL_TIERS    = ['All', 'Critical', 'Soon', 'Today', 'Flexible', 'ASAP']
const ALL_VEHICLES = ['All', ...Object.keys(VEHICLE_LABEL)]

function FilterBar({ tier, setTier, veh, setVeh, openOnly, setOpenOnly }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      padding: '10px 20px', background: WH, borderBottom: `1px solid ${GR200}`,
    }}>
      <FiFilter size={12} color={GR400} />
      <span style={{ fontSize: 10, fontWeight: 600, color: GR400, textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 2 }}>Urgency</span>
      {ALL_TIERS.map(t => {
        const u = URGENCY[t]
        const active = tier === t
        return (
          <button
            key={t}
            onClick={() => setTier(t)}
            style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: active ? BK : GR100,
              color: active ? WH : GR600,
              border: 'none', cursor: 'pointer', letterSpacing: 0.2,
            }}
          >{t === 'All' ? 'All' : `${u?.icon} ${t}`}</button>
        )
      })}
      <div style={{ width: 1, height: 16, background: GR200, margin: '0 2px' }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: GR400, textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 2 }}>Vehicle</span>
      {ALL_VEHICLES.map(v => (
        <button
          key={v}
          onClick={() => setVeh(v)}
          style={{
            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: veh === v ? BK : GR100,
            color: veh === v ? WH : GR600,
            border: 'none', cursor: 'pointer', letterSpacing: 0.2,
          }}
        >{v === 'All' ? 'All' : VEHICLE_LABEL[v]}</button>
      ))}
      <div style={{ width: 1, height: 16, background: GR200, margin: '0 2px' }} />
      <button
        onClick={() => setOpenOnly(o => !o)}
        style={{
          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: openOnly ? BK : GR100,
          color: openOnly ? WH : GR600,
          border: 'none', cursor: 'pointer', letterSpacing: 0.2,
        }}
      >
        {openOnly ? '✓ Unbid only' : 'Unbid only'}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveFeed() {
  const [orders,       setOrders]       = useState([])
  const [myBids,       setMyBids]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [lastPollIds,  setLastPollIds]  = useState(null)
  const [newIds,       setNewIds]       = useState(new Set())
  const [tier,         setTier]         = useState('All')
  const [veh,          setVeh]          = useState('All')
  const [openOnly,     setOpenOnly]     = useState(false)
  const [highlightedCriticalIds, setHighlightedCriticalIds] = useState(new Set())

  const criticalRef = useRef(null)
  const pollRef     = useRef(null)

  const fetchData = useCallback(async (isFirst = false) => {
    try {
      const [ordersRes, bidsRes] = await Promise.all([
        api.get('/admin/orders', { params: { limit: 100 } }),
        api.get('/admin/my-bids'),
      ])
      const incoming = ordersRes.data?.data || []
      const bids     = bidsRes.data?.data  || []

      setMyBids(bids)
      setOrders(incoming)

      if (!isFirst && lastPollIds !== null) {
        const freshIds = new Set()
        incoming.forEach(o => { if (!lastPollIds.has(o.id)) freshIds.add(o.id) })
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

  const sorted = useMemo(() =>
    [...orders].sort((a, b) => {
      const ds = (b.urgency_score ?? 0) - (a.urgency_score ?? 0)
      return ds !== 0 ? ds : new Date(a.created_at) - new Date(b.created_at)
    }), [orders])

  const filtered = useMemo(() =>
    sorted.filter(o => {
      if (o.status === 'confirmed' || o.status === 'completed' || o.status === 'booked') return false
      if (tier !== 'All' && o.urgency_label !== tier) return false
      if (veh !== 'All' && o.vehicle_type !== veh) return false
      if (openOnly && myBidMap[o.id]) return false
      return true
    }), [sorted, tier, veh, openOnly, myBidMap])

  const unbidCritical = useMemo(() =>
    filtered.filter(o => o.urgency_label === 'Critical' && !myBidMap[o.id]),
  [filtered, myBidMap])

  const scrollToCritical = () => {
    criticalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const ids = new Set(unbidCritical.map(o => o.id))
    setHighlightedCriticalIds(ids)
    setTimeout(() => setHighlightedCriticalIds(new Set()), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ padding: '20px 24px 16px', background: GR50, flexShrink: 0, borderBottom: `1px solid ${GR200}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: BK,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiZap size={16} color={WH} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: GR900, margin: 0, letterSpacing: -0.3 }}>Live Feed</h1>
              <div style={{ fontSize: 11, color: GR400, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 999, background: BK,
                  display: 'inline-block', animation: 'dotBlink 2s ease infinite',
                }} />
                Every 2 s · {filtered.length} open {filtered.length === 1 ? 'ride' : 'rides'}
              </div>
            </div>
          </div>

          {unbidCritical.length > 1 && (
            <button
              onClick={scrollToCritical}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9,
                background: BK, color: WH,
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
                animation: 'pulse 1.4s ease infinite',
              }}
            >
              <FiAlertTriangle size={13} />
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 18px', background: GR50 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: GR400, paddingTop: 60 }}>
            <FiRefreshCw size={22} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p style={{ fontSize: 13, marginTop: 10 }}>Loading feed…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: GR400, paddingTop: 60 }}>
            <FiInbox size={38} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: GR600 }}>No open rides match your filters</p>
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
            highlighted={highlightedCriticalIds.has(order.id)}
          />
        ))}
      </div>
    </div>
  )
}
