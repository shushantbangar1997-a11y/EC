import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FiDollarSign, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp, FiMapPin, FiNavigation2 } from 'react-icons/fi'
import api from '../../utils/api'

const NAVY_DEEP = '#0a1628'
const GOLD = '#F6C90E'
const ELECTRIC = '#0EA5E9'

function Stat({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background: '#fff', padding: 22, borderRadius: 14,
      border: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: NAVY_DEEP, marginTop: 4, fontFamily: 'monospace', lineHeight: 1.1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Earnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/earnings')
        setData(res.data?.data || null)
      } finally { setLoading(false) }
    }
    fetch()
    const id = setInterval(fetch, 8000)
    return () => clearInterval(id)
  }, [])

  if (loading || !data) {
    return <div style={{ padding: 40, color: '#94a3b8' }}>Loading earnings…</div>
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f4f5f8' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY_DEEP, margin: '0 0 4px' }}>Earnings</h1>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px' }}>
        Tracking revenue from accepted offers.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 26 }}>
        <Stat icon={FiDollarSign} label="Total earned" value={`$${data.accepted_total.toLocaleString()}`} color={GOLD}
              sub={`from ${data.accepted_count} accepted ${data.accepted_count === 1 ? 'offer' : 'offers'}`} />
        <Stat icon={FiCheckCircle} label="Accepted" value={data.accepted_count} color="#16a34a" />
        <Stat icon={FiClock} label="Pending" value={data.pending_count} color={ELECTRIC}
              sub="Waiting on customer" />
        <Stat icon={FiXCircle} label="Declined" value={data.declined_count} color="#94a3b8" />
      </div>

      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FiTrendingUp size={18} color={NAVY_DEEP} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY_DEEP, margin: 0 }}>Recent confirmed rides</h2>
        </div>

        {data.recent.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, padding: 24, textAlign: 'center' }}>
            No confirmed rides yet. Once a customer accepts one of your offers, it will appear here.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {data.recent.map(b => (
              <div key={b.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px',
                gap: 14, padding: '12px 14px',
                background: '#f8fafc', borderRadius: 10,
                border: '1px solid #f1f5f9',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY_DEEP, marginBottom: 4 }}>
                    {b.request?.name || 'Customer'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiMapPin size={11} style={{ color: GOLD }} />
                    {b.request?.pickup}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiNavigation2 size={11} style={{ color: ELECTRIC }} />
                    {b.request?.dropoff}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Confirmed {format(new Date(b.updated_at || b.created_at), 'MMM d, yyyy · h:mm a')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: GOLD, fontFamily: 'monospace' }}>
                    ${b.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
