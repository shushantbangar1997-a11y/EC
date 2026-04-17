import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  FiCheckCircle, FiMapPin, FiNavigation2,
  FiClock, FiUsers, FiPhone, FiMail, FiTruck, FiInbox,
} from 'react-icons/fi'
import api from '../../utils/api'
import { useAdminTheme } from '../../context/AdminThemeContext'

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

export default function Trips() {
  const { theme: T } = useAdminTheme()
  const [bids,    setBids]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try { const res = await api.get('/admin/my-bids', { params: { status: 'accepted' } }); setBids(res.data?.data || []) }
      finally { setLoading(false) }
    }
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: T.pageBg }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: -0.3 }}>Trips</h1>
      <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 22px' }}>Confirmed rides ready to dispatch.</p>

      {loading && <div style={{ color: T.textMuted }}>Loading…</div>}

      {!loading && bids.length === 0 && (
        <div style={{ background: T.card, borderRadius: 12, padding: 56, textAlign: 'center', color: T.textMuted, border: `1px solid ${T.border}` }}>
          <FiInbox size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600, color: T.textSub }}>No confirmed trips yet</p>
          <p style={{ fontSize: 12, marginTop: 5 }}>Once a customer accepts one of your offers it will land here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {bids.map(b => (
          <div key={b.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.btnBg}`, overflow: 'hidden' }}>
            {/* Confirmation banner */}
            <div style={{
              padding: '10px 20px', background: T.btnBg,
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 11, fontWeight: 700, color: T.btnText,
              letterSpacing: 0.4, textTransform: 'uppercase',
              borderBottom: `1px solid ${T.border}`,
            }}>
              <FiCheckCircle size={13} />
              Confirmed · ${b.price}
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: T.isDark ? '#666' : 'rgba(255,255,255,0.5)' }}>
                Order #{b.quote_request_id}
              </span>
            </div>

            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 10 }}>{b.request?.name || 'Customer'}</div>
                <div style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <FiMapPin size={11} color={T.textMuted} />
                  <strong style={{ color: T.text }}>{b.request?.pickup}</strong>
                </div>
                <div style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <FiNavigation2 size={11} color={T.textMuted} />
                  <strong style={{ color: T.text }}>{b.request?.dropoff}</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: T.textMuted }}>
                  {b.request?.ride_date && <span><FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />{format(new Date(b.request.ride_date), 'MMM d · h:mm a')}</span>}
                  <span><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} />{b.request?.passengers || 1}</span>
                  <span><FiTruck size={10} style={{ display: 'inline', marginRight: 3 }} />{VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Customer contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {b.request?.phone && (
                    <a href={`tel:${b.request.phone}`} style={{ fontSize: 13, color: T.text, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <FiPhone size={12} color={T.textMuted} /> {b.request.phone}
                    </a>
                  )}
                  {b.request?.email && (
                    <a href={`mailto:${b.request.email}`} style={{ fontSize: 13, color: T.text, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <FiMail size={12} color={T.textMuted} /> {b.request.email}
                    </a>
                  )}
                </div>
                {b.message && (
                  <div style={{ marginTop: 12, padding: '8px 10px', background: T.surfaceAlt, borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, color: T.textSub, fontStyle: 'italic' }}>
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
