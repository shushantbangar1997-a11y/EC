import React, { useEffect, useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiMapPin, FiClock, FiUsers, FiTruck, FiPhone, FiMail,
  FiDollarSign, FiSend, FiMessageSquare, FiRefreshCw, FiNavigation2,
  FiCheckCircle, FiInbox,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../utils/api'

const NAVY = '#0f1f3d'
const NAVY_DEEP = '#0a1628'
const GOLD = '#F6C90E'
const ELECTRIC = '#0EA5E9'

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

const STATUS_PILL = {
  pending: { label: 'New', bg: '#fef3c7', fg: '#92400e' },
  new:     { label: 'New', bg: '#fef3c7', fg: '#92400e' },
  quoted:  { label: 'Bid Sent', bg: '#dbeafe', fg: '#1e3a8a' },
  contacted:{ label: 'Bid Sent', bg: '#dbeafe', fg: '#1e3a8a' },
  confirmed:{ label: 'Confirmed', bg: '#dcfce7', fg: '#166534' },
  booked:  { label: 'Booked', bg: '#dcfce7', fg: '#166534' },
  completed:{ label: 'Completed', bg: '#e5e7eb', fg: '#374151' },
}

function StaticMap({ pickup, dropoff }) {
  // Lightweight visual placeholder map (no external API key needed)
  return (
    <div
      style={{
        height: 160,
        borderRadius: 12,
        background: `linear-gradient(135deg, #1e3a5f 0%, ${NAVY} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Decorative grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={GOLD} strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Route line */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path d="M 30 130 Q 50% 30 95% 50" stroke={GOLD} strokeWidth="2.5" fill="none"
              strokeDasharray="6 4" opacity="0.85" />
        <circle cx="30" cy="130" r="7" fill={GOLD} />
        <circle cx="30" cy="130" r="3" fill={NAVY_DEEP} />
      </svg>
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 18, height: 18, borderRadius: 999,
        background: '#fff', border: `3px solid ${ELECTRIC}`,
      }} />
      <div style={{
        position: 'absolute', bottom: 12, left: 14,
        color: '#fff', fontSize: 11, fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 6,
        maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        <FiMapPin size={10} style={{ display: 'inline', marginRight: 4, color: GOLD }} />
        {pickup}
      </div>
      <div style={{
        position: 'absolute', top: 12, right: 38,
        color: '#fff', fontSize: 11, fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 6,
        maxWidth: '55%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        <FiNavigation2 size={10} style={{ display: 'inline', marginRight: 4, color: ELECTRIC }} />
        {dropoff}
      </div>
    </div>
  )
}

function BidComposer({ order, onBidSent }) {
  const [price, setPrice] = useState('')
  const [vehicle, setVehicle] = useState(order.vehicle_type || 'sedan')
  const [eta, setEta] = useState(30)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset when order changes
  useEffect(() => {
    setPrice('')
    setVehicle(order.vehicle_type || 'sedan')
    setEta(30)
    setMessage('')
  }, [order.id])

  const submit = async (e) => {
    e.preventDefault()
    const n = Number(price)
    if (!n || n <= 0) {
      toast.error('Enter a valid price')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/quote-requests/${order.id}/bids`, {
        price: n,
        vehicle_type: vehicle,
        eta_minutes: Number(eta) || 30,
        message,
      })
      toast.success('Offer sent to customer')
      setPrice(''); setMessage('')
      onBidSent?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        padding: '18px 24px',
        boxShadow: '0 -8px 24px -16px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FiSend size={13} color={NAVY_DEEP} />
        </div>
        <div style={{ fontWeight: 700, color: NAVY_DEEP, fontSize: 14 }}>Send Your Offer</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Customer sees this within 5 seconds</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 180px 130px 1fr auto', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>
            YOUR PRICE (USD)
          </label>
          <div style={{ position: 'relative' }}>
            <FiDollarSign size={14} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
            <input
              type="number" min="1" step="1" required
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="120"
              style={{
                width: '100%', padding: '10px 12px 10px 32px',
                border: `2px solid ${price ? GOLD : '#e5e7eb'}`,
                borderRadius: 10, fontSize: 18, fontWeight: 700,
                color: NAVY_DEEP, outline: 'none', transition: 'border 120ms',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>
            VEHICLE OFFERED
          </label>
          <select
            value={vehicle}
            onChange={e => setVehicle(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #e5e7eb', borderRadius: 10,
              fontSize: 13, color: NAVY_DEEP, background: '#fff', outline: 'none',
              fontWeight: 600,
            }}
          >
            {Object.entries(VEHICLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>
            ETA (MIN)
          </label>
          <input
            type="number" min="5" max="240" value={eta}
            onChange={e => setEta(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #e5e7eb', borderRadius: 10,
              fontSize: 13, color: NAVY_DEEP, fontWeight: 600, outline: 'none',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>
            PERSONAL MESSAGE TO CUSTOMER
          </label>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Complimentary water and Wi-Fi included"
            maxLength={140}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #e5e7eb', borderRadius: 10,
              fontSize: 13, color: NAVY_DEEP, outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !price}
          style={{
            padding: '11px 20px',
            background: submitting || !price ? '#cbd5e1' : `linear-gradient(135deg, ${GOLD}, #d4a90c)`,
            color: NAVY_DEEP,
            border: 'none', borderRadius: 10,
            fontWeight: 800, fontSize: 13,
            cursor: submitting || !price ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: submitting || !price ? 'none' : `0 4px 14px rgba(246,201,14,0.4)`,
            whiteSpace: 'nowrap',
          }}
        >
          <FiSend size={14} />
          {submitting ? 'Sending...' : 'Send Offer'}
        </button>
      </div>
    </form>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('open') // open | all | confirmed
  const [myBids, setMyBids] = useState([])
  const pollRef = useRef(null)

  const refresh = async () => {
    try {
      const [ordersRes, bidsRes] = await Promise.all([
        api.get('/admin/orders', { params: { limit: 100 } }),
        api.get('/admin/my-bids'),
      ])
      setOrders(ordersRes.data?.data || [])
      setMyBids(bidsRes.data?.data || [])
    } catch (err) {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    pollRef.current = setInterval(refresh, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filter === 'all') return true
      if (filter === 'confirmed') return o.status === 'confirmed' || o.status === 'booked' || o.status === 'completed'
      // open
      return o.status !== 'confirmed' && o.status !== 'booked' && o.status !== 'completed'
    })
  }, [orders, filter])

  // Auto-select first if none selected
  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id)
    if (selectedId && !filtered.find(o => o.id === selectedId) && filtered.length) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selected = orders.find(o => o.id === selectedId) || null
  const myBidOnSelected = selected ? myBids.find(b => b.quote_request_id === selected.id) : null

  const counts = {
    open: orders.filter(o => o.status !== 'confirmed' && o.status !== 'booked' && o.status !== 'completed').length,
    confirmed: orders.filter(o => o.status === 'confirmed' || o.status === 'booked').length,
    all: orders.length,
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f4f5f8' }}>
      {/* List pane */}
      <div
        style={{
          width: 380,
          background: '#fff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* List header */}
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: NAVY_DEEP, margin: 0 }}>Orders</h1>
            <button
              onClick={refresh}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600,
              }}
            >
              <FiRefreshCw size={12} /> Refresh
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'open', label: 'Open', count: counts.open },
              { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
              { id: 'all', label: 'All', count: counts.all },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12, fontWeight: 700,
                  background: filter === t.id ? NAVY_DEEP : '#f1f5f9',
                  color: filter === t.id ? '#fff' : '#64748b',
                  border: 'none', borderRadius: 999,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {t.label}
                <span style={{
                  background: filter === t.id ? GOLD : '#cbd5e1',
                  color: filter === t.id ? NAVY_DEEP : '#475569',
                  fontSize: 10, fontWeight: 800,
                  padding: '1px 6px', borderRadius: 999,
                  minWidth: 16, textAlign: 'center',
                }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <FiRefreshCw size={20} className="animate-spin" style={{ display: 'inline-block' }} />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <FiInbox size={32} style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No orders yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>New customer rides will appear here.</p>
            </div>
          )}
          {filtered.map(o => {
            const active = o.id === selectedId
            const myBid = myBids.find(b => b.quote_request_id === o.id)
            const status = STATUS_PILL[o.status] || STATUS_PILL.pending
            return (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '14px 18px',
                  border: 'none', background: active ? '#fefce8' : '#fff',
                  borderLeft: active ? `3px solid ${GOLD}` : '3px solid transparent',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NAVY_DEEP, fontFamily: 'monospace' }}>
                    #{o.id}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: 999,
                    background: status.bg, color: status.fg,
                    letterSpacing: 0.4,
                  }}>{status.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: GOLD, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.pickup}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: ELECTRIC, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dropoff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FiClock size={10} /> {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                  </span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FiUsers size={10} /> {o.passengers}
                  </span>
                  <span>·</span>
                  <span>{VEHICLE_LABEL[o.vehicle_type] || o.vehicle_type}</span>
                  {myBid && (
                    <span style={{ marginLeft: 'auto', color: GOLD, fontWeight: 700, fontFamily: 'monospace' }}>
                      ${myBid.price}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ textAlign: 'center' }}>
              <FiInbox size={42} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Select an order to view details</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {/* Header card */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: 22,
                border: '1px solid #e5e7eb', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                      Order #{selected.id}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY_DEEP, margin: '6px 0 4px' }}>
                      {selected.name || 'Guest customer'}
                    </h2>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Submitted {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {(() => {
                    const s = STATUS_PILL[selected.status] || STATUS_PILL.pending
                    return (
                      <span style={{
                        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                        padding: '6px 12px', borderRadius: 999,
                        background: s.bg, color: s.fg, letterSpacing: 0.6,
                      }}>{s.label}</span>
                    )
                  })()}
                </div>

                <StaticMap pickup={selected.pickup} dropoff={selected.dropoff} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
                  <Detail icon={FiMapPin} label="Pickup"  value={selected.pickup} />
                  <Detail icon={FiNavigation2} label="Dropoff" value={selected.dropoff} />
                  <Detail icon={FiClock} label="Pickup time"
                          value={selected.ride_date ? format(new Date(selected.ride_date), 'MMM d, yyyy · h:mm a') : 'Flexible'} />
                  <Detail icon={FiUsers} label="Passengers" value={String(selected.passengers || 1)} />
                  <Detail icon={FiTruck} label="Vehicle requested"
                          value={VEHICLE_LABEL[selected.vehicle_type] || selected.vehicle_type} />
                  {selected.phone && (
                    <Detail icon={FiPhone} label="Phone" value={selected.phone} href={`tel:${selected.phone}`} />
                  )}
                  {selected.email && (
                    <Detail icon={FiMail} label="Email" value={selected.email} href={`mailto:${selected.email}`} />
                  )}
                </div>

                {selected.notes && (
                  <div style={{
                    marginTop: 16, padding: 14,
                    background: '#f8fafc', borderRadius: 10,
                    borderLeft: `3px solid ${ELECTRIC}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>
                      <FiMessageSquare size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Customer note
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', fontStyle: 'italic' }}>"{selected.notes}"</div>
                  </div>
                )}
              </div>

              {/* Existing bids on this order */}
              {selected.bids?.length > 0 && (
                <div style={{
                  background: '#fff', borderRadius: 14, padding: 20,
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                    Bids on this order ({selected.bids.length})
                  </div>
                  {selected.bids.map(b => {
                    const accepted = b.status === 'accepted'
                    const declined = b.status === 'declined'
                    return (
                      <div key={b.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 0', borderTop: '1px solid #f1f5f9',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: accepted ? '#dcfce7' : declined ? '#fee2e2' : `${GOLD}33`,
                          color: accepted ? '#166534' : declined ? '#991b1b' : NAVY_DEEP,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {accepted ? <FiCheckCircle size={16} /> : <FiDollarSign size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY_DEEP }}>
                            {b.operator_name}
                            {accepted && <span style={{ marginLeft: 8, color: '#166534', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>· Accepted</span>}
                            {declined && <span style={{ marginLeft: 8, color: '#991b1b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>· Declined</span>}
                          </div>
                          {b.message && <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>"{b.message}"</div>}
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            ETA ~{b.eta_minutes} min · {VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}
                          </div>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: GOLD, fontFamily: 'monospace' }}>
                          ${b.price}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bid composer at the bottom */}
            {selected.status !== 'confirmed' && selected.status !== 'booked' && selected.status !== 'completed' ? (
              myBidOnSelected && myBidOnSelected.status === 'pending' ? (
                <div style={{
                  background: '#fefce8', borderTop: '1px solid #fde68a',
                  padding: '14px 24px', textAlign: 'center', fontSize: 13, color: '#92400e', fontWeight: 600,
                }}>
                  Your offer of <strong style={{ color: NAVY_DEEP }}>${myBidOnSelected.price}</strong> is pending the customer's response.
                  You can send another offer below to update.
                  <BidComposer order={selected} onBidSent={refresh} />
                </div>
              ) : (
                <BidComposer order={selected} onBidSent={refresh} />
              )
            ) : (
              <div style={{
                background: '#dcfce7', borderTop: '1px solid #86efac',
                padding: '18px 24px', textAlign: 'center', color: '#166534', fontWeight: 700, fontSize: 14,
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

function Detail({ icon: Icon, label, value, href }) {
  const inner = (
    <>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: '#f1f5f9', color: NAVY_DEEP,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: NAVY_DEEP, fontWeight: 600, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
    </>
  )
  const baseStyle = { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }
  return href
    ? <a href={href} style={{ ...baseStyle, color: 'inherit' }}>{inner}</a>
    : <div style={baseStyle}>{inner}</div>
}
