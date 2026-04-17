import React from 'react'
import { FiUser, FiMail, FiShield, FiSettings } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const NAVY_DEEP = '#0a1628'
const GOLD = '#F6C90E'
const ELECTRIC = '#0EA5E9'

export default function Profile() {
  const { user } = useAuth()
  const initials = (user?.name || 'A').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f4f5f8' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY_DEEP, margin: '0 0 22px' }}>Profile</h1>

      <div style={{
        background: '#fff', borderRadius: 14, padding: 28,
        border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 22,
        marginBottom: 18,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 999,
          background: `linear-gradient(135deg, ${GOLD}, #d4a90c)`,
          color: NAVY_DEEP,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 900,
          boxShadow: `0 6px 20px rgba(246,201,14,0.35)`,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NAVY_DEEP }}>{user?.name || 'Admin'}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiMail size={12} /> {user?.email}
          </div>
          <div style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', background: `${ELECTRIC}18`, color: ELECTRIC,
            borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            <FiShield size={11} /> {user?.role || 'admin'}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FiSettings size={16} color={NAVY_DEEP} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: NAVY_DEEP, margin: 0 }}>Provider Settings</h2>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Account settings, payout details, and notification preferences will appear here.
        </p>
      </div>
    </div>
  )
}
