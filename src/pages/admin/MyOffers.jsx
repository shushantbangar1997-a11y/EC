import React, { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { FiClock, FiMapPin, FiNavigation2, FiDollarSign, FiCheckCircle, FiXCircle, FiClock as FiPending, FiInbox, FiUsers } from 'react-icons/fi'
import api from '../../utils/api'

const NAVY_DEEP = '#0a1628'
const GOLD = '#F6C90E'

const TABS = [
  { id: 'pending',  label: 'Pending',  color: '#1e3a8a', bg: '#dbeafe', icon: FiPending },
  { id: 'accepted', label: 'Accepted', color: '#166534', bg: '#dcfce7', icon: FiCheckCircle },
  { id: 'declined', label: 'Declined', color: '#991b1b', bg: '#fee2e2', icon: FiXCircle },
  { id: 'expired',  label: 'Expired',  color: '#374151', bg: '#e5e7eb', icon: FiClock },
]

export default function MyOffers() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')

  const refresh = async () => {
    try {
      const res = await api.get('/admin/my-bids')
      setBids(res.data?.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [])

  const counts = TABS.reduce((acc, t) => {
    acc[t.id] = bids.filter(b => (b.status || 'pending') === t.id).length
    return acc
  }, {})

  const filtered = bids.filter(b => (b.status || 'pending') === tab)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f4f5f8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY_DEEP, margin: 0 }}>My Offers</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Every bid you've sent and how the customer responded.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 14px',
                fontSize: 13, fontWeight: 700,
                background: active ? NAVY_DEEP : '#fff',
                color: active ? '#fff' : '#475569',
                border: '1px solid ' + (active ? NAVY_DEEP : '#e5e7eb'),
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <t.icon size={13} />
              {t.label}
              <span style={{
                background: active ? GOLD : t.bg, color: active ? NAVY_DEEP : t.color,
                fontSize: 10, fontWeight: 800,
                padding: '2px 7px', borderRadius: 999, minWidth: 18, textAlign: 'center',
              }}>{counts[t.id] || 0}</span>
            </button>
          )
        })}
      </div>

      {loading && <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', color: '#94a3b8', border: '1px solid #e5e7eb' }}>
          <FiInbox size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>No {tab} offers</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Bids you've sent will show up here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(b => {
          const status = TABS.find(t => t.id === (b.status || 'pending')) || TABS[0]
          return (
            <div key={b.id} style={{
              background: '#fff', borderRadius: 14, padding: 20,
              border: '1px solid #e5e7eb',
              display: 'grid', gridTemplateColumns: '1fr 120px', gap: 18,
              borderLeft: `4px solid ${status.color}`,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6,
                    padding: '3px 8px', borderRadius: 999,
                    background: status.bg, color: status.color,
                  }}>{status.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY_DEEP, fontFamily: 'monospace' }}>
                    Order #{b.quote_request_id}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    · sent {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY_DEEP, marginBottom: 5 }}>
                  {b.request?.name || 'Customer'}
                </div>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <FiMapPin size={12} style={{ color: GOLD }} /> {b.request?.pickup}
                </div>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <FiNavigation2 size={12} style={{ color: '#0EA5E9' }} /> {b.request?.dropoff}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#94a3b8' }}>
                  {b.request?.ride_date && (
                    <span><FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />
                      {format(new Date(b.request.ride_date), 'MMM d, h:mm a')}
                    </span>
                  )}
                  <span><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} /> {b.request?.passengers || 1}</span>
                  <span>ETA ~{b.eta_minutes} min</span>
                </div>
                {b.message && (
                  <div style={{
                    marginTop: 10, padding: 10,
                    background: '#f8fafc', borderRadius: 8,
                    fontSize: 12, color: '#475569', fontStyle: 'italic',
                  }}>"{b.message}"</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Your Price
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: GOLD, fontFamily: 'monospace', lineHeight: 1.1, marginTop: 4 }}>
                  ${b.price}
                </div>
                {b.status === 'accepted' && (
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, marginTop: 6 }}>
                    <FiCheckCircle size={11} style={{ display: 'inline', marginRight: 3 }} /> Confirmed
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
