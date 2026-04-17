import React from 'react'
import { FiMail, FiShield, FiSettings } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const BK    = '#0a0a0a'
const WH    = '#ffffff'
const GR50  = '#fafafa'
const GR100 = '#f5f5f5'
const GR200 = '#e5e5e5'
const GR400 = '#a3a3a3'
const GR600 = '#525252'
const GR900 = '#171717'

export default function Profile() {
  const { user } = useAuth()
  const initials = (user?.name || 'A').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: GR50 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: GR900, margin: '0 0 22px', letterSpacing: -0.3 }}>Profile</h1>

      {/* Profile card */}
      <div style={{
        background: WH, borderRadius: 12, padding: 26,
        border: `1px solid ${GR200}`,
        display: 'flex', alignItems: 'center', gap: 22,
        marginBottom: 16,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999,
          background: BK, color: WH,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, letterSpacing: 1,
          flexShrink: 0,
        }}>{initials}</div>

        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: GR900, letterSpacing: -0.3 }}>
            {user?.name || 'Admin'}
          </div>
          <div style={{ fontSize: 13, color: GR600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiMail size={12} color={GR400} /> {user?.email}
          </div>
          <div style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: GR100, color: GR600,
            border: `1px solid ${GR200}`,
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            letterSpacing: 0.8, textTransform: 'uppercase',
          }}>
            <FiShield size={10} /> {user?.role || 'admin'}
          </div>
        </div>
      </div>

      {/* Settings card */}
      <div style={{ background: WH, borderRadius: 12, padding: 22, border: `1px solid ${GR200}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <FiSettings size={15} color={GR900} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: GR900, margin: 0 }}>Provider Settings</h2>
        </div>
        <p style={{ fontSize: 13, color: GR400, margin: 0, lineHeight: 1.6 }}>
          Account settings, payout details, and notification preferences will appear here.
        </p>
      </div>
    </div>
  )
}
