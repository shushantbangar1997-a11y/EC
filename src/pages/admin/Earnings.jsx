import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  FiDollarSign, FiCheckCircle, FiClock, FiXCircle,
  FiTrendingUp, FiMapPin, FiNavigation2,
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

function Stat({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: WH, padding: 20, borderRadius: 12,
      border: `1px solid ${GR200}`,
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accent ? `${accent}12` : GR100,
        color: accent || GR600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: GR400, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: GR900, marginTop: 3, fontFamily: 'monospace', lineHeight: 1.1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: GR400, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Earnings() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/earnings')
        setData(res.data?.data || null)
      } finally { setLoading(false) }
    }
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  if (loading || !data) {
    return <div style={{ padding: 40, color: GR400, fontSize: 13 }}>Loading earnings…</div>
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: GR50 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: GR900, margin: '0 0 4px', letterSpacing: -0.3 }}>Earnings</h1>
      <p style={{ fontSize: 13, color: GR400, margin: '0 0 22px' }}>
        Revenue from accepted offers.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Stat
          icon={FiDollarSign} label="Total earned"
          value={`$${data.accepted_total.toLocaleString()}`}
          sub={`from ${data.accepted_count} accepted ${data.accepted_count === 1 ? 'offer' : 'offers'}`}
        />
        <Stat icon={FiCheckCircle} label="Accepted"  value={data.accepted_count} />
        <Stat icon={FiClock}       label="Pending"   value={data.pending_count}   sub="Waiting on customer" />
        <Stat icon={FiXCircle}     label="Declined"  value={data.declined_count} />
      </div>

      <div style={{
        background: WH, borderRadius: 12, padding: 22,
        border: `1px solid ${GR200}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <FiTrendingUp size={16} color={GR900} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: GR900, margin: 0, letterSpacing: -0.1 }}>
            Recent confirmed rides
          </h2>
        </div>

        {data.recent.length === 0 ? (
          <p style={{ color: GR400, fontSize: 13, padding: '20px 0', textAlign: 'center', margin: 0 }}>
            No confirmed rides yet. Once a customer accepts one of your offers, it will appear here.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {data.recent.map(b => (
              <div key={b.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 90px',
                gap: 12, padding: '12px 14px',
                background: GR50, borderRadius: 9,
                border: `1px solid ${GR200}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: GR900, marginBottom: 4 }}>
                    {b.request?.name || 'Customer'}
                  </div>
                  <div style={{ fontSize: 11, color: GR600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <FiMapPin size={10} color={GR400} />
                    {b.request?.pickup}
                  </div>
                  <div style={{ fontSize: 11, color: GR600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <FiNavigation2 size={10} color={GR400} />
                    {b.request?.dropoff}
                  </div>
                  <div style={{ fontSize: 10, color: GR400 }}>
                    Confirmed {format(new Date(b.updated_at || b.created_at), 'MMM d, yyyy · h:mm a')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: GR900, fontFamily: 'monospace' }}>
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
