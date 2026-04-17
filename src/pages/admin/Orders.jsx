import React, { useEffect, useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiMapPin, FiClock, FiUsers, FiTruck, FiPhone, FiMail,
  FiDollarSign, FiSend, FiMessageSquare, FiRefreshCw, FiNavigation2,
  FiCheckCircle, FiInbox,
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

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

const STATUS_PILL = {
  pending:   { label: 'New',       bg: GR100,    fg: GR600 },
  new:       { label: 'New',       bg: GR100,    fg: GR600 },
  quoted:    { label: 'Bid Sent',  bg: '#eff6ff', fg: '#1d4ed8' },
  contacted: { label: 'Bid Sent',  bg: '#eff6ff', fg: '#1d4ed8' },
  confirmed: { label: 'Confirmed', bg: '#f0fdf4', fg: '#166534' },
  booked:    { label: 'Booked',    bg: '#f0fdf4', fg: '#166534' },
  completed: { label: 'Completed', bg: GR100,    fg: GR400   },
}

// ── Decorative route map ──────────────────────────────────────────────────────
function StaticMap({ pickup, dropoff }) {
  return (
    <div style={{
      height: 150,
      borderRadius: 11,
      background: GR900,
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${GR200}`,
    }}>
      {/* Grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke={WH} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Route */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path d="M 32 120 Q 50% 30 95% 46" stroke={WH} strokeWidth="1.5" fill="none"
              strokeDasharray="5 3" opacity="0.5" />
        <circle cx="32"  cy="120" r="6" fill={WH} opacity="0.9" />
        <circle cx="32"  cy="120" r="2.5" fill={GR900} />
      </svg>
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 14, height: 14, borderRadius: 999,
        background: WH, opacity: 0.9,
        border: `2px solid ${GR400}`,
      }} />
      <div style={{
        position: 'absolute', bottom: 10, left: 12,
        color: WH, fontSize: 10, opacity: 0.7,
        background: 'rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 5,
        maxWidth: '55%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        <FiMapPin size={9} style={{ display: 'inline', marginRight: 3 }} />{pickup}
      </div>
      <div style={{
        position: 'absolute', top: 10, right: 32,
        color: WH, fontSize: 10, opacity: 0.7,
        background: 'rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 5,
        maxWidth: '50%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        <FiNavigation2 size={9} style={{ display: 'inline', marginRight: 3 }} />{dropoff}
      </div>
    </div>
  )
}

// ── Bid composer ──────────────────────────────────────────────────────────────
function BidComposer({ order, onBidSent }) {
  const [price,     setPrice]     = useState('')
  const [vehicle,   setVehicle]   = useState(order.vehicle_type || 'sedan')
  const [eta,       setEta]       = useState(30)
  const [message,   setMessage]   = useState('')
  const [submitting,setSubmitting]= useState(false)

  useEffect(() => {
    setPrice(''); setVehicle(order.vehicle_type || 'sedan'); setEta(30); setMessage('')
  }, [order.id])

  const submit = async (e) => {
    e.preventDefault()
    const n = Number(price)
    if (!n || n <= 0) { toast.error('Enter a valid price'); return }
    setSubmitting(true)
    try {
      await api.post(`/quote-requests/${order.id}/bids`, {
        price: n, vehicle_type: vehicle, eta_minutes: Number(eta) || 30, message,
      })
      toast.success('Offer sent to customer')
      setPrice(''); setMessage('')
      onBidSent?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer')
    } finally { setSubmitting(false) }
  }

  const inputBase = {
    width: '100%', padding: '9px 11px',
    border: `1px solid ${GR200}`, borderRadius: 9,
    fontSize: 13, color: GR900, outline: 'none',
    background: WH, fontFamily: 'inherit',
  }
  const labelBase = {
    fontSize: 10, fontWeight: 600, color: GR400,
    display: 'block', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: 0.8,
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: WH, borderTop: `1px solid ${GR200}`,
        padding: '18px 24px',
        boxShadow: '0 -6px 20px -14px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: BK, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FiSend size={12} color={WH} />
        </div>
        <div style={{ fontWeight: 600, color: GR900, fontSize: 13 }}>Send Your Offer</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: GR400 }}>Customer sees this within 5 seconds</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 110px 1fr auto', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={labelBase}>Price (USD)</label>
          <div style={{ position: 'relative' }}>
            <FiDollarSign size={13} style={{ position: 'absolute', left: 11, top: 12, color: GR400 }} />
            <input
              type="number" min="1" step="1" required
              value={price} onChange={e => setPrice(e.target.value)}
              placeholder="120"
              style={{ ...inputBase, paddingLeft: 30, fontSize: 17, fontWeight: 700, fontFamily: 'monospace',
                border: `1px solid ${price ? BK : GR200}` }}
            />
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
          <input
            type="number" min="5" max="240" value={eta}
            onChange={e => setEta(e.target.value)}
            style={{ ...inputBase, fontWeight: 600 }}
          />
        </div>
        <div>
          <label style={labelBase}>Personal message</label>
          <input
            type="text" value={message} onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Complimentary water and Wi-Fi included"
            maxLength={140} style={inputBase}
          />
        </div>
        <button
          type="submit" disabled={submitting || !price}
          style={{
            padding: '10px 18px',
            background: submitting || !price ? GR200 : BK,
            color: submitting || !price ? GR400 : WH,
            border: 'none', borderRadius: 9,
            fontWeight: 600, fontSize: 13,
            cursor: submitting || !price ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', letterSpacing: 0.2,
          }}
        >
          <FiSend size={13} />
          {submitting ? 'Sending…' : 'Send Offer'}
        </button>
      </div>
    </form>
  )
}

// ── Detail row ────────────────────────────────────────────────────────────────
function Detail({ icon: Icon, label, value, href }) {
  const inner = (
    <>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: GR100, color: GR600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={13} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, color: GR400, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 13, color: GR900, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
    </>
  )
  const base = { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }
  return href ? <a href={href} style={{ ...base, color: 'inherit' }}>{inner}</a> : <div style={base}>{inner}</div>
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Orders() {
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

  useEffect(() => {
    refresh()
    pollRef.current = setInterval(refresh, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  const filtered = useMemo(() => orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'confirmed') return ['confirmed','booked','completed'].includes(o.status)
    return !['confirmed','booked','completed'].includes(o.status)
  }), [orders, filter])

  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id)
    if (selectedId && !filtered.find(o => o.id === selectedId) && filtered.length) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selected         = orders.find(o => o.id === selectedId) || null
  const myBidOnSelected  = selected ? myBids.find(b => b.quote_request_id === selected.id) : null

  const counts = {
    open:      orders.filter(o => !['confirmed','booked','completed'].includes(o.status)).length,
    confirmed: orders.filter(o => ['confirmed','booked'].includes(o.status)).length,
    all:       orders.length,
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: GR50 }}>
      {/* ── Left list pane ─────────────────────────────────────── */}
      <div style={{
        width: 360, background: WH,
        borderRight: `1px solid ${GR200}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* List header */}
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${GR200}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: GR900, margin: 0, letterSpacing: -0.2 }}>Orders</h1>
            <button
              onClick={refresh}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: GR400, display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 500,
              }}
            >
              <FiRefreshCw size={11} /> Refresh
            </button>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[
              { id: 'open',      label: 'Open',      count: counts.open },
              { id: 'confirmed', label: 'Confirmed',  count: counts.confirmed },
              { id: 'all',       label: 'All',        count: counts.all },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  padding: '5px 11px', fontSize: 12, fontWeight: 600,
                  background: filter === t.id ? BK : GR100,
                  color: filter === t.id ? WH : GR600,
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {t.label}
                <span style={{
                  background: filter === t.id ? WH : GR200,
                  color: filter === t.id ? BK : GR600,
                  fontSize: 10, fontWeight: 700,
                  padding: '0 5px', borderRadius: 999, minWidth: 16, textAlign: 'center',
                }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 28, textAlign: 'center', color: GR400, fontSize: 13 }}>
              <FiRefreshCw size={18} style={{ display: 'inline-block' }} />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: GR400 }}>
              <FiInbox size={30} style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No orders yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>New customer rides will appear here.</p>
            </div>
          )}
          {filtered.map(o => {
            const active  = o.id === selectedId
            const myBid   = myBids.find(b => b.quote_request_id === o.id)
            const status  = STATUS_PILL[o.status] || STATUS_PILL.pending
            return (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '13px 18px',
                  border: 'none',
                  background: active ? GR50 : WH,
                  borderLeft: `3px solid ${active ? BK : 'transparent'}`,
                  borderBottom: `1px solid ${GR200}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: GR400, fontFamily: 'monospace' }}>
                    #{o.id}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    padding: '2px 7px', borderRadius: 999,
                    background: status.bg, color: status.fg, letterSpacing: 0.4,
                  }}>{status.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: GR900, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: GR900, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.pickup}</span>
                </div>
                <div style={{ fontSize: 12, color: GR600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: GR400, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dropoff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: GR400 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FiClock size={10} /> {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                  </span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FiUsers size={10} /> {o.passengers}
                  </span>
                  {myBid && (
                    <span style={{ marginLeft: 'auto', color: GR900, fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>
                      ${myBid.price}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail pane ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GR400 }}>
            <div style={{ textAlign: 'center' }}>
              <FiInbox size={38} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Select an order to view details</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px' }}>
              {/* Header card */}
              <div style={{
                background: WH, borderRadius: 13, padding: 22,
                border: `1px solid ${GR200}`, marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: GR400, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      Order #{selected.id}
                    </div>
                    <h2 style={{ fontSize: 19, fontWeight: 700, color: GR900, margin: '5px 0 3px', letterSpacing: -0.3 }}>
                      {selected.name || 'Guest customer'}
                    </h2>
                    <div style={{ fontSize: 11, color: GR400 }}>
                      Submitted {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {(() => {
                    const s = STATUS_PILL[selected.status] || STATUS_PILL.pending
                    return (
                      <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        padding: '5px 11px', borderRadius: 999,
                        background: s.bg, color: s.fg, letterSpacing: 0.5,
                      }}>{s.label}</span>
                    )
                  })()}
                </div>

                <StaticMap pickup={selected.pickup} dropoff={selected.dropoff} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 18 }}>
                  <Detail icon={FiMapPin}      label="Pickup"   value={selected.pickup} />
                  <Detail icon={FiNavigation2} label="Dropoff"  value={selected.dropoff} />
                  <Detail icon={FiClock}       label="Pickup time"
                          value={selected.ride_date ? format(new Date(selected.ride_date), 'MMM d, yyyy · h:mm a') : 'Flexible'} />
                  <Detail icon={FiUsers}       label="Passengers" value={String(selected.passengers || 1)} />
                  <Detail icon={FiTruck}       label="Vehicle requested"
                          value={VEHICLE_LABEL[selected.vehicle_type] || selected.vehicle_type} />
                  {selected.phone && <Detail icon={FiPhone} label="Phone" value={selected.phone} href={`tel:${selected.phone}`} />}
                  {selected.email && <Detail icon={FiMail}  label="Email" value={selected.email} href={`mailto:${selected.email}`} />}
                </div>

                {selected.notes && (
                  <div style={{
                    marginTop: 14, padding: 12,
                    background: GR50, borderRadius: 9,
                    borderLeft: `3px solid ${GR200}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: GR400, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                      <FiMessageSquare size={10} style={{ display: 'inline', marginRight: 4 }} />Customer note
                    </div>
                    <div style={{ fontSize: 13, color: GR600, fontStyle: 'italic' }}>"{selected.notes}"</div>
                  </div>
                )}
              </div>

              {/* Existing bids */}
              {selected.bids?.length > 0 && (
                <div style={{
                  background: WH, borderRadius: 13, padding: 20,
                  border: `1px solid ${GR200}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: GR400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                    Bids on this order ({selected.bids.length})
                  </div>
                  {selected.bids.map(b => {
                    const accepted = b.status === 'accepted'
                    const declined = b.status === 'declined'
                    return (
                      <div key={b.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 0', borderTop: `1px solid ${GR200}`,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: accepted ? '#f0fdf4' : declined ? '#fef2f2' : GR100,
                          color: accepted ? '#166534' : declined ? '#b91c1c' : GR600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {accepted ? <FiCheckCircle size={15} /> : <FiDollarSign size={15} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: GR900 }}>
                            {b.operator_name}
                            {accepted && <span style={{ marginLeft: 7, color: '#166534', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>· Accepted</span>}
                            {declined && <span style={{ marginLeft: 7, color: '#b91c1c', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>· Declined</span>}
                          </div>
                          {b.message && <div style={{ fontSize: 12, color: GR600, fontStyle: 'italic', marginTop: 2 }}>"{b.message}"</div>}
                          <div style={{ fontSize: 11, color: GR400, marginTop: 2 }}>
                            ETA ~{b.eta_minutes} min · {VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}
                          </div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: GR900, fontFamily: 'monospace' }}>
                          ${b.price}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bid composer */}
            {selected.status !== 'confirmed' && selected.status !== 'booked' && selected.status !== 'completed' ? (
              myBidOnSelected && myBidOnSelected.status === 'pending' ? (
                <div>
                  <div style={{
                    background: GR50, borderTop: `1px solid ${GR200}`,
                    padding: '11px 24px', textAlign: 'center',
                    fontSize: 12, color: GR600, fontWeight: 500,
                  }}>
                    Your offer of <strong style={{ color: GR900 }}>${myBidOnSelected.price}</strong> is pending. You can update it below.
                  </div>
                  <BidComposer order={selected} onBidSent={refresh} />
                </div>
              ) : (
                <BidComposer order={selected} onBidSent={refresh} />
              )
            ) : (
              <div style={{
                background: '#f0fdf4', borderTop: '1px solid #bbf7d0',
                padding: '16px 24px', textAlign: 'center', color: '#166534', fontWeight: 600, fontSize: 13,
              }}>
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
