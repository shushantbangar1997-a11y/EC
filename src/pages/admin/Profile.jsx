import React from 'react'
import { FiMail, FiShield, FiSettings } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useAdminTheme } from '../../context/AdminThemeContext'

export default function Profile() {
  const { user }    = useAuth()
  const { theme: T } = useAdminTheme()
  const initials = (user?.name || 'A').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: T.pageBg }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 22px', letterSpacing: -0.3 }}>Profile</h1>

      {/* Profile card */}
      <div style={{ background: T.card, borderRadius: 12, padding: 26, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 22, marginBottom: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999,
          background: T.btnBg, color: T.btnText,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, letterSpacing: 1, flexShrink: 0,
        }}>{initials}</div>

        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>{user?.name || 'Admin'}</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiMail size={12} color={T.textMuted} /> {user?.email}
          </div>
          <div style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', background: T.surfaceAlt, color: T.textSub,
            border: `1px solid ${T.border}`, borderRadius: 999,
            fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
          }}>
            <FiShield size={10} /> {user?.role || 'admin'}
          </div>
        </div>
      </div>

      {/* Settings card */}
      <div style={{ background: T.card, borderRadius: 12, padding: 22, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <FiSettings size={15} color={T.text} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Provider Settings</h2>
        </div>
        <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
          Account settings, payout details, and notification preferences will appear here.
        </p>
      </div>
    </div>
  )
}
