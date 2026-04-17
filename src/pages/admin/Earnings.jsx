import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  FiDollarSign, FiCheckCircle, FiClock, FiXCircle,
  FiTrendingUp, FiMapPin, FiNavigation2,
} from 'react-icons/fi'
import api from '../../utils/api'
import { useAdminTheme } from '../../context/AdminThemeContext'

function Stat({ icon: Icon, label, value, sub }) {
  const { theme: T } = useAdminTheme()
  return (
    <div style={{ background: T.card, padding: 20, borderRadius: 12, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surfaceAlt, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 3, fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Earnings() {
  const { theme: T } = useAdminTheme()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try { const res = await api.get('/admin/earnings'); setData(res.data?.data || null) }
      finally { setLoading(false) }
    }
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  if (loading || !data) return <div style={{ padding: 40, color: T.textMuted, fontSize: 13 }}>Loading earnings…</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: T.pageBg }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: -0.3 }}>Earnings</h1>
      <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 22px' }}>Revenue from accepted offers.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Stat icon={FiDollarSign}  label="Total earned" value={`$${data.accepted_total.toLocaleString()}`}
              sub={`from ${data.accepted_count} accepted ${data.accepted_count === 1 ? 'offer' : 'offers'}`} />
        <Stat icon={FiCheckCircle} label="Accepted"  value={data.accepted_count} />
        <Stat icon={FiClock}       label="Pending"   value={data.pending_count}  sub="Waiting on customer" />
        <Stat icon={FiXCircle}     label="Declined"  value={data.declined_count} />
      </div>

      <div style={{ background: T.card, borderRadius: 12, padding: 22, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <FiTrendingUp size={16} color={T.text} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, letterSpacing: -0.1 }}>Recent confirmed rides</h2>
        </div>

        {data.recent.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: 13, padding: '20px 0', textAlign: 'center', margin: 0 }}>
            No confirmed rides yet. Once a customer accepts one of your offers, it will appear here.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {data.recent.map(b => (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 12, padding: '12px 14px', background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.borderSoft}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{b.request?.name || 'Customer'}</div>
                  <div style={{ fontSize: 11, color: T.textSub, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <FiMapPin size={10} color={T.textMuted} />{b.request?.pickup}
                  </div>
                  <div style={{ fontSize: 11, color: T.textSub, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <FiNavigation2 size={10} color={T.textMuted} />{b.request?.dropoff}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    Confirmed {format(new Date(b.updated_at || b.created_at), 'MMM d, yyyy · h:mm a')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>${b.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
