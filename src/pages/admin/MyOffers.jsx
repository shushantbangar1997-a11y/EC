import React, { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiClock, FiMapPin, FiNavigation2,
  FiCheckCircle, FiXCircle, FiInbox, FiUsers,
} from 'react-icons/fi'
import api from '../../utils/api'

const BK    = '#0a0a0a'
const WH    = '#ffffff'
const GR50  = '#fafafa'
const GR100 = '#f5f5f5'
const GR200 = '#e5e5e5'
const GR400 = '#a3a3a3'
const GR600 = '#525252'
const GR900 = '#171717'

const TABS = [
  { id: 'pending',  label: 'Pending',  borderColor: GR400, bg: GR100, fg: GR600, icon: FiClock },
  { id: 'accepted', label: 'Accepted', borderColor: BK,    bg: BK,    fg: WH,    icon: FiCheckCircle },
  { id: 'declined', label: 'Declined', borderColor: GR200, bg: GR100, fg: GR400, icon: FiXCircle, strikethrough: true },
  { id: 'expired',  label: 'Expired',  borderColor: GR200, bg: GR100, fg: GR400, icon: FiClock },
]

export default function MyOffers() {
  const [bids,    setBids]    = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('pending')

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

  const counts   = TABS.reduce((acc, t) => {
    acc[t.id] = bids.filter(b => (b.status || 'pending') === t.id).length
    return acc
  }, {})
  const filtered = bids.filter(b => (b.status || 'pending') === tab)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: GR50 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: GR900, margin: '0 0 4px', letterSpacing: -0.3 }}>My Offers</h1>
        <p style={{ fontSize: 13, color: GR400, margin: 0 }}>Every bid you've sent and how the customer responded.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 13px', fontSize: 12, fontWeight: 600,
                background: active ? BK : WH,
                color: active ? WH : GR600,
                border: `1px solid ${active ? BK : GR200}`,
                borderRadius: 9, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.2,
              }}
            >
              <t.icon size={12} />
              {t.label}
              <span style={{
                background: active ? WH : GR100,
                color: active ? BK : GR400,
                fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center',
              }}>{counts[t.id] || 0}</span>
            </button>
          )
        })}
      </div>

      {loading && <div style={{ color: GR400, fontSize: 13 }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{
          background: WH, borderRadius: 12, padding: 56,
          textAlign: 'center', color: GR400, border: `1px solid ${GR200}`,
        }}>
          <FiInbox size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600, color: GR600 }}>No {tab} offers</p>
          <p style={{ fontSize: 12, marginTop: 5 }}>Bids you've sent will show up here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(b => {
          const status = TABS.find(t => t.id === (b.status || 'pending')) || TABS[0]
          return (
            <div key={b.id} style={{
              background: WH, borderRadius: 12, padding: 18,
              border: `1px solid ${GR200}`,
              display: 'grid', gridTemplateColumns: '1fr 110px', gap: 16,
              borderLeft: `4px solid ${status.borderColor}`,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
                    padding: '2px 8px', borderRadius: 999,
                    background: status.bg, color: status.fg,
                  }}>{status.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: GR400, fontFamily: 'monospace' }}>
                    Order #{b.quote_request_id}
                  </span>
                  <span style={{ fontSize: 11, color: GR400 }}>
                    · sent {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: GR900, marginBottom: 6 }}>
                  {b.request?.name || 'Customer'}
                </div>
                <div style={{ fontSize: 12, color: GR600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <FiMapPin size={11} color={GR400} /> {b.request?.pickup}
                </div>
                <div style={{ fontSize: 12, color: GR600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  <FiNavigation2 size={11} color={GR400} /> {b.request?.dropoff}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: GR400, flexWrap: 'wrap' }}>
                  {b.request?.ride_date && (
                    <span>
                      <FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />
                      {format(new Date(b.request.ride_date), 'MMM d, h:mm a')}
                    </span>
                  )}
                  <span><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} />{b.request?.passengers || 1}</span>
                  <span>ETA ~{b.eta_minutes} min</span>
                </div>
                {b.message && (
                  <div style={{
                    marginTop: 10, padding: '8px 10px',
                    background: GR50, borderRadius: 7,
                    fontSize: 12, color: GR600, fontStyle: 'italic',
                    border: `1px solid ${GR200}`,
                  }}>"{b.message}"</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: GR400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Your Price
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, marginTop: 4,
                  color: status.strikethrough ? GR400 : GR900,
                  textDecoration: status.strikethrough ? 'line-through' : 'none',
                }}>
                  ${b.price}
                </div>
                {b.status === 'accepted' && (
                  <div style={{ fontSize: 11, color: GR600, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <FiCheckCircle size={11} /> Confirmed
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
