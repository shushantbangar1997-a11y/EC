import React, { useEffect, useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiMapPin, FiClock, FiUsers, FiTruck, FiPhone, FiMail,
  FiDollarSign, FiSend, FiMessageSquare, FiRefreshCw, FiNavigation2,
  FiCheckCircle, FiInbox,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useAdminTheme } from '../../context/AdminThemeContext'

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

// Status pills — grayscale only (colors derived from theme tokens at render)
const STATUS_KEY = {
  pending:   { label: 'New',       style: 'alt' },
  new:       { label: 'New',       style: 'alt' },
  quoted:    { label: 'Bid Sent',  style: 'strong' },
  contacted: { label: 'Bid Sent',  style: 'strong' },
  confirmed: { label: 'Confirmed', style: 'strong' },
  booked:    { label: 'Booked',    style: 'strong' },
  completed: { label: 'Completed', style: 'muted' },
}

function statusPill(key, T) {
  const s = STATUS_KEY[key] || STATUS_KEY.pending
  if (s.style === 'strong') return { label: s.label, bg: T.btnBg, fg: T.btnText }
  if (s.style === 'muted')  return { label: s.label, bg: T.surfaceAlt, fg: T.textMuted }
  return { label: s.label, bg: T.surfaceAlt, fg: T.textSub }
}

// ── Decorative route map ──────────────────────────────────────────────────────
function StaticMap({ pickup, dropoff }) {
  const { theme: T } = useAdminTheme()
  return (
    <div style={{
      height: 150, borderRadius: 11,
      background: T.isDark ? '#0a0a0a' : '#171717',
      position: 'relative', overflow: 'hidden', border: `1px solid ${T.border}`,
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: T.isDark ? 0.05 : 0.08 }}>
        <defs>
          <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path d="M 32 120 Q 50% 30 95% 46" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.4" />
        <circle cx="32" cy="120" r="6" fill="#ffffff" opacity="0.8" />
        <circle cx="32" cy="120" r="2.5" fill="#111111" />
      </svg>
      <div style={{ position: 'absolute', top: 12, right: 12, width: 14, height: 14, borderRadius: 999, background: '#ffffff', opacity: 0.8, border: '2px solid #666' }} />
      <div style={{ position: 'absolute', bottom: 10, left: 12, color: '#fff', fontSize: 10, opacity: 0.65, background: 'rgba(255,255,255,0.08)', padding: '3px 7px', borderRadius: 5, maxWidth: '55%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <FiMapPin size={9} style={{ display: 'inline', marginRight: 3 }} />{pickup}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 32, color: '#fff', fontSize: 10, opacity: 0.65, background: 'rgba(255,255,255,0.08)', padding: '3px 7px', borderRadius: 5, maxWidth: '50%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <FiNavigation2 size={9} style={{ display: 'inline', marginRight: 3 }} />{dropoff}
      </div>
    </div>
  )
}

// ── Bid composer ──────────────────────────────────────────────────────────────
function BidComposer({ order, onBidSent }) {
  const { theme: T } = useAdminTheme()
  const [price,      setPrice]      = useState('')
  const [vehicle,    setVehicle]    = useState(order.vehicle_type || 'sedan')
  const [eta,        setEta]        = useState(30)
  const [message,    setMessage]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { setPrice(''); setVehicle(order.vehicle_type || 'sedan'); setEta(30); setMessage('') }, [order.id])

  const inputBase = { width: '100%', padding: '9px 11px', border: `1px solid ${T.inputBorder}`, borderRadius: 9, fontSize: 13, color: T.text, outline: 'none', background: T.inputBg, fontFamily: 'inherit' }
  const labelBase = { fontSize: 10, fontWeight: 600, color: T.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }

  const submit = async (e) => {
    e.preventDefault()
    const n = Number(price)
    if (!n || n <= 0) { toast.error('Enter a valid price'); return }
    setSubmitting(true)
    try {
      await api.post(`/quote-requests/${order.id}/bids`, { price: n, vehicle_type: vehicle, eta_minutes: Number(eta) || 30, message })
      toast.success('Offer sent to customer', {
        icon: '🚖',
        style: { background: '#0a0a0a', color: '#ffffff', border: '1px solid #1e1e1e', borderRadius: 10, fontSize: 13 },
      })
      setPrice(''); setMessage('')
      onBidSent?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer')
    } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={submit} style={{
      background: T.card, borderTop: `1px solid ${T.border}`,
      padding: '18px 24px',
      boxShadow: T.isDark ? '0 -4px 14px rgba(0,0,0,0.3)' : '0 -6px 20px -14px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: T.btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiSend size={12} color={T.btnText} />
        </div>
        <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>Send Your Offer</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: T.textMuted }}>Customer sees this within 5 seconds</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 110px 1fr auto', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={labelBase}>Price (USD)</label>
          <div style={{ position: 'relative' }}>
            <FiDollarSign size={13} style={{ position: 'absolute', left: 11, top: 12, color: T.textMuted }} />
            <input type="number" min="1" step="1" required value={price} onChange={e => setPrice(e.target.value)} placeholder="120"
              style={{ ...inputBase, paddingLeft: 30, fontSize: 17, fontWeight: 700, fontFamily: 'monospace', border: `1px solid ${price ? T.text : T.inputBorder}` }} />
          </div>
        </div>
        <div>
          <label style={labelBase}>Vehicle offered</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} style={inputBase}>
            {Object.entries(VEHICLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelBase}>ETA (min)</label>
          <input type="number" min="5" max="240" value={eta} onChange={e => setEta(e.target.value)} style={{ ...inputBase, fontWeight: 600 }} />
        </div>
        <div>
          <label style={labelBase}>Personal message</label>
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Complimentary water and Wi-Fi included" maxLength={140} style={inputBase} />
        </div>
        <button type="submit" disabled={submitting || !price} style={{
          padding: '10px 18px',
          background: submitting || !price ? T.btnDisBg : T.btnBg,
          color: submitting || !price ? T.btnDisText : T.btnText,
          border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 13,
          cursor: submitting || !price ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', letterSpacing: 0.2,
        }}>
          <FiSend size={13} />
          {submitting ? 'Sending…' : 'Send Offer'}
        </button>
      </div>
    </form>
  )
}

// ── Detail row ────────────────────────────────────────────────────────────────
function Detail({ icon: Icon, label, value, href }) {
  const { theme: T } = useAdminTheme()
  const inner = (
    <>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: T.surfaceAlt, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </>
  )
  const base = { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }
  return href ? <a href={href} style={{ ...base, color: 'inherit' }}>{inner}</a> : <div style={base}>{inner}</div>
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Orders() {
  const { theme: T } = useAdminTheme()
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [filter,     setFilter]     = useState('open')
  const [myBids,     setMyBids]     = useState([])
  const pollRef = useRef(null)

  const refresh = async () => {
    try {
      const [ordersRes, bidsRes] = await Promise.all([
        api.get('/admin/orders', { params: { limit: 100 } }),
        api.get('/admin/my-bids'),
      ])
      setOrders(ordersRes.data?.data || [])
      setMyBids(bidsRes.data?.data  || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { refresh(); pollRef.current = setInterval(refresh, 5000); return () => clearInterval(pollRef.current) }, [])

  const filtered = useMemo(() => orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'confirmed') return ['confirmed','booked','completed'].includes(o.status)
    return !['confirmed','booked','completed'].includes(o.status)
  }), [orders, filter])

  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id)
    if (selectedId && !filtered.find(o => o.id === selectedId) && filtered.length) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  const selected        = orders.find(o => o.id === selectedId) || null
  const myBidOnSelected = selected ? myBids.find(b => b.quote_request_id === selected.id) : null

  const counts = {
    open:      orders.filter(o => !['confirmed','booked','completed'].includes(o.status)).length,
    confirmed: orders.filter(o => ['confirmed','booked'].includes(o.status)).length,
    all:       orders.length,
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: T.pageBg }}>
      {/* ── List pane ─────────────────────────────────────────────── */}
      <div style={{ width: 360, background: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: -0.2 }}>Orders</h1>
            <button onClick={refresh} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500 }}>
              <FiRefreshCw size={11} /> Refresh
            </button>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[
              { id: 'open',      label: 'Open',     count: counts.open },
              { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
              { id: 'all',       label: 'All',       count: counts.all },
            ].map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)} style={{
                padding: '5px 11px', fontSize: 12, fontWeight: 600,
                background: filter === t.id ? T.btnBg : T.surfaceAlt,
                color: filter === t.id ? T.btnText : T.textSub,
                border: 'none', borderRadius: 999, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {t.label}
                <span style={{ background: filter === t.id ? T.btnText : T.border, color: filter === t.id ? T.btnBg : T.textSub, fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 999, minWidth: 16, textAlign: 'center' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 28, textAlign: 'center', color: T.textMuted }}><FiRefreshCw size={18} /></div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
              <FiInbox size={30} style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No orders yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>New customer rides will appear here.</p>
            </div>
          )}
          {filtered.map(o => {
            const active = o.id === selectedId
            const myBid  = myBids.find(b => b.quote_request_id === o.id)
            const pill   = statusPill(o.status, T)
            return (
              <button key={o.id} onClick={() => setSelectedId(o.id)} style={{
                width: '100%', textAlign: 'left', padding: '13px 18px',
                border: 'none', background: active ? T.surfaceAlt : T.card,
                borderLeft: `3px solid ${active ? T.btnBg : 'transparent'}`,
                borderBottom: `1px solid ${T.borderSoft}`, cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: 'monospace' }}>#{o.id}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999, background: pill.bg, color: pill.fg, letterSpacing: 0.4 }}>{pill.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: T.text, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.pickup}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: T.textMuted, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dropoff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: T.textMuted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FiClock size={10} /> {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}</span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FiUsers size={10} /> {o.passengers}</span>
                  {myBid && <span style={{ marginLeft: 'auto', color: T.text, fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>${myBid.price}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail pane ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
            <div style={{ textAlign: 'center' }}>
              <FiInbox size={38} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Select an order to view details</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px' }}>
              <div style={{ background: T.card, borderRadius: 13, padding: 22, border: `1px solid ${T.border}`, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Order #{selected.id}</div>
                    <h2 style={{ fontSize: 19, fontWeight: 700, color: T.text, margin: '5px 0 3px', letterSpacing: -0.3 }}>{selected.name || 'Guest customer'}</h2>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Submitted {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</div>
                  </div>
                  {(() => { const p = statusPill(selected.status, T); return <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '5px 11px', borderRadius: 999, background: p.bg, color: p.fg, letterSpacing: 0.5 }}>{p.label}</span> })()}
                </div>

                <StaticMap pickup={selected.pickup} dropoff={selected.dropoff} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 18 }}>
                  <Detail icon={FiMapPin}      label="Pickup"   value={selected.pickup} />
                  <Detail icon={FiNavigation2} label="Dropoff"  value={selected.dropoff} />
                  <Detail icon={FiClock}       label="Pickup time" value={selected.ride_date ? format(new Date(selected.ride_date), 'MMM d, yyyy · h:mm a') : 'Flexible'} />
                  <Detail icon={FiUsers}       label="Passengers" value={String(selected.passengers || 1)} />
                  <Detail icon={FiTruck}       label="Vehicle"  value={VEHICLE_LABEL[selected.vehicle_type] || selected.vehicle_type} />
                  {selected.phone && <Detail icon={FiPhone} label="Phone" value={selected.phone} href={`tel:${selected.phone}`} />}
                  {selected.email && <Detail icon={FiMail}  label="Email" value={selected.email} href={`mailto:${selected.email}`} />}
                </div>

                {selected.notes && (
                  <div style={{ marginTop: 14, padding: 12, background: T.surfaceAlt, borderRadius: 9, borderLeft: `3px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                      <FiMessageSquare size={10} style={{ display: 'inline', marginRight: 4 }} />Customer note
                    </div>
                    <div style={{ fontSize: 13, color: T.textSub, fontStyle: 'italic' }}>"{selected.notes}"</div>
                  </div>
                )}
              </div>

              {selected.bids?.length > 0 && (
                <div style={{ background: T.card, borderRadius: 13, padding: 20, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                    Bids on this order ({selected.bids.length})
                  </div>
                  {selected.bids.map(b => {
                    const accepted = b.status === 'accepted'
                    const declined = b.status === 'declined'
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: `1px solid ${T.border}` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: accepted ? T.btnBg : T.surfaceAlt, color: accepted ? T.btnText : T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {accepted ? <FiCheckCircle size={15} /> : <FiDollarSign size={15} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                            {b.operator_name}
                            {accepted && <span style={{ marginLeft: 7, color: T.text, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>· Accepted</span>}
                            {declined && <span style={{ marginLeft: 7, color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>· Declined</span>}
                          </div>
                          {b.message && <div style={{ fontSize: 12, color: T.textSub, fontStyle: 'italic', marginTop: 2 }}>"{b.message}"</div>}
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>ETA ~{b.eta_minutes} min · {VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}</div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>${b.price}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {!['confirmed','booked','completed'].includes(selected.status) ? (
              myBidOnSelected?.status === 'pending' ? (
                <div>
                  <div style={{ background: T.surfaceAlt, borderTop: `1px solid ${T.border}`, padding: '11px 24px', textAlign: 'center', fontSize: 12, color: T.textSub, fontWeight: 500 }}>
                    Your offer of <strong style={{ color: T.text }}>${myBidOnSelected.price}</strong> is pending. You can update it below.
                  </div>
                  <BidComposer order={selected} onBidSent={refresh} />
                </div>
              ) : (
                <BidComposer order={selected} onBidSent={refresh} />
              )
            ) : (
              <div style={{ background: T.surfaceAlt, borderTop: `1px solid ${T.border}`, padding: '16px 24px', textAlign: 'center', color: T.text, fontWeight: 600, fontSize: 13 }}>
                <FiCheckCircle style={{ display: 'inline', marginRight: 6, marginBottom: -2 }} />
                Confirmed at ${selected.bid_price}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
