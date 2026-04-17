import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  FiCheckCircle, FiMapPin, FiNavigation2,
  FiClock, FiUsers, FiPhone, FiMail, FiTruck, FiInbox,
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

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

export default function Trips() {
  const [bids,    setBids]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/my-bids', { params: { status: 'accepted' } })
        setBids(res.data?.data || [])
      } finally { setLoading(false) }
    }
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: GR50 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: GR900, margin: '0 0 4px', letterSpacing: -0.3 }}>Trips</h1>
      <p style={{ fontSize: 13, color: GR400, margin: '0 0 22px' }}>
        Confirmed rides ready to dispatch.
      </p>

      {loading && <div style={{ color: GR400 }}>Loading…</div>}

      {!loading && bids.length === 0 && (
        <div style={{
          background: WH, borderRadius: 12, padding: 56,
          textAlign: 'center', color: GR400, border: `1px solid ${GR200}`,
        }}>
          <FiInbox size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600, color: GR600 }}>No confirmed trips yet</p>
          <p style={{ fontSize: 12, marginTop: 5 }}>Once a customer accepts one of your offers it will land here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {bids.map(b => (
          <div key={b.id} style={{
            background: WH, borderRadius: 12,
            border: `1px solid ${GR200}`,
            borderLeft: '4px solid #16a34a',
            overflow: 'hidden',
          }}>
            {/* Confirmation banner */}
            <div style={{
              padding: '10px 20px',
              background: '#f0fdf4',
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 11, fontWeight: 700, color: '#166534',
              letterSpacing: 0.4, textTransform: 'uppercase',
              borderBottom: '1px solid #bbf7d0',
            }}>
              <FiCheckCircle size={13} />
              Confirmed · ${b.price}
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#4ade80' }}>
                Order #{b.quote_request_id}
              </span>
            </div>

            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: GR900, marginBottom: 10 }}>
                  {b.request?.name || 'Customer'}
                </div>
                <div style={{ fontSize: 12, color: GR600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <FiMapPin size={11} color={GR400} />
                  <strong style={{ color: GR900 }}>{b.request?.pickup}</strong>
                </div>
                <div style={{ fontSize: 12, color: GR600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <FiNavigation2 size={11} color={GR400} />
                  <strong style={{ color: GR900 }}>{b.request?.dropoff}</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: GR400 }}>
                  {b.request?.ride_date && (
                    <span>
                      <FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />
                      {format(new Date(b.request.ride_date), 'MMM d · h:mm a')}
                    </span>
                  )}
                  <span><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} />{b.request?.passengers || 1}</span>
                  <span><FiTruck size={10} style={{ display: 'inline', marginRight: 3 }} />{VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: GR400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>
                  Customer contact
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {b.request?.phone && (
                    <a href={`tel:${b.request.phone}`} style={{
                      fontSize: 13, color: GR900, fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                    }}>
                      <FiPhone size={12} color={GR400} /> {b.request.phone}
                    </a>
                  )}
                  {b.request?.email && (
                    <a href={`mailto:${b.request.email}`} style={{
                      fontSize: 13, color: GR900, fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                    }}>
                      <FiMail size={12} color={GR400} /> {b.request.email}
                    </a>
                  )}
                </div>
                {b.message && (
                  <div style={{
                    marginTop: 12, padding: '8px 10px',
                    background: GR50, borderRadius: 7,
                    border: `1px solid ${GR200}`,
                    fontSize: 12, color: GR600, fontStyle: 'italic',
                  }}>
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
