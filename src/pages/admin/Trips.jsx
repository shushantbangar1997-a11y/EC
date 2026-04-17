import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FiCheckCircle, FiMapPin, FiNavigation2, FiClock, FiUsers, FiPhone, FiMail, FiTruck, FiInbox } from 'react-icons/fi'
import api from '../../utils/api'

const NAVY_DEEP = '#0a1628'
const GOLD = '#F6C90E'
const ELECTRIC = '#0EA5E9'

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

export default function Trips() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/my-bids', { params: { status: 'accepted' } })
        setBids(res.data?.data || [])
      } finally { setLoading(false) }
    }
    fetch()
    const id = setInterval(fetch, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f4f5f8' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY_DEEP, margin: '0 0 4px' }}>Trips</h1>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px' }}>
        Confirmed rides ready to dispatch.
      </p>

      {loading && <div style={{ color: '#94a3b8' }}>Loading…</div>}
      {!loading && bids.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', color: '#94a3b8', border: '1px solid #e5e7eb' }}>
          <FiInbox size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>No confirmed trips yet</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Once a customer accepts one of your offers it will land here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {bids.map(b => (
          <div key={b.id} style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid #e5e7eb',
            borderLeft: `4px solid #16a34a`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 22px', background: '#dcfce7',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 700, color: '#166534', letterSpacing: 0.4, textTransform: 'uppercase',
            }}>
              <FiCheckCircle size={14} />
              Confirmed · ${b.price}
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#166534' }}>
                Order #{b.quote_request_id}
              </span>
            </div>
            <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: NAVY_DEEP, marginBottom: 10 }}>
                  {b.request?.name || 'Customer'}
                </div>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <FiMapPin size={12} style={{ color: GOLD }} /> <strong>{b.request?.pickup}</strong>
                </div>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <FiNavigation2 size={12} style={{ color: ELECTRIC }} /> <strong>{b.request?.dropoff}</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#64748b' }}>
                  {b.request?.ride_date && (
                    <span><FiClock size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {format(new Date(b.request.ride_date), 'MMM d · h:mm a')}
                    </span>
                  )}
                  <span><FiUsers size={11} style={{ display: 'inline', marginRight: 4 }} /> {b.request?.passengers || 1}</span>
                  <span><FiTruck size={11} style={{ display: 'inline', marginRight: 4 }} /> {VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                  Customer contact
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {b.request?.phone && (
                    <a href={`tel:${b.request.phone}`} style={{ fontSize: 13, color: NAVY_DEEP, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <FiPhone size={12} color={ELECTRIC} /> {b.request.phone}
                    </a>
                  )}
                  {b.request?.email && (
                    <a href={`mailto:${b.request.email}`} style={{ fontSize: 13, color: NAVY_DEEP, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <FiMail size={12} color={ELECTRIC} /> {b.request.email}
                    </a>
                  )}
                </div>
                {b.message && (
                  <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                    Your message: "{b.message}"
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
