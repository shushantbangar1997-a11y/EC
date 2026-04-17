import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiInbox, FiTag, FiTruck, FiDollarSign, FiUser,
  FiLogOut, FiBell, FiZap, FiSun, FiMoon,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { AdminThemeProvider, useAdminTheme } from '../../context/AdminThemeContext'
import api from '../../utils/api'

const NAV_ITEMS = [
  { to: '/admin/live-feed', label: 'Live Feed',   icon: FiZap,       badgeKey: 'liveFeed', liveDot: true },
  { to: '/admin/orders',    label: 'New Orders',  icon: FiInbox,     badgeKey: 'newOrders' },
  { to: '/admin/offers',    label: 'My Offers',   icon: FiTag,       badgeKey: 'pendingOffers' },
  { to: '/admin/trips',     label: 'Trips',       icon: FiTruck,     badgeKey: 'confirmedTrips' },
  { to: '/admin/earnings',  label: 'Earnings',    icon: FiDollarSign },
  { to: '/admin/profile',   label: 'Profile',     icon: FiUser },
]

function AdminPortalInner() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme: T, toggle } = useAdminTheme()
  const [counts, setCounts] = useState({ liveFeed: 0, newOrders: 0, pendingOffers: 0, confirmedTrips: 0 })
  const lastSeenRef = useRef(localStorage.getItem('adminLastSeen') || new Date().toISOString())
  const knownIdsRef = useRef(new Set(JSON.parse(localStorage.getItem('adminKnownOrderIds') || '[]')))

  const handleLogout = () => { logout(); navigate('/login') }

  useEffect(() => {
    let stopped = false
    const tick = async () => {
      try {
        const [ordersRes, bidsRes] = await Promise.all([
          api.get('/admin/orders', { params: { limit: 100 } }),
          api.get('/admin/my-bids'),
        ])
        if (stopped) return
        const orders = ordersRes.data?.data || []
        const bids   = bidsRes.data?.data  || []

        const fresh = []
        for (const o of orders) {
          if (!knownIdsRef.current.has(o.id) && new Date(o.created_at) > new Date(lastSeenRef.current)) fresh.push(o)
          knownIdsRef.current.add(o.id)
        }
        if (fresh.length) {
          localStorage.setItem('adminKnownOrderIds', JSON.stringify([...knownIdsRef.current]))
          fresh.forEach(o => toast.success(`New ride: ${o.pickup} → ${o.dropoff}`, {
            icon: '🚖',
            style: { background: '#0a0a0a', color: '#ffffff', border: '1px solid #1e1e1e', borderRadius: 10, fontSize: 13 },
          }))
        }

        const unbid = (o) => {
          const myBid = bids.find(b => b.quote_request_id === o.id)
          return !myBid && !['confirmed','completed','booked'].includes(o.status)
        }
        const liveFeedCount = orders.filter(unbid).length

        setCounts({
          liveFeed:       liveFeedCount,
          newOrders:      liveFeedCount,
          pendingOffers:  bids.filter(b => b.status === 'pending').length,
          confirmedTrips: bids.filter(b => b.status === 'accepted').length,
        })
        document.title = liveFeedCount > 0
          ? `(${liveFeedCount}) New Orders · Everywhere Transfers`
          : 'Everywhere Transfers · Admin'
      } catch {}
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => { stopped = true; clearInterval(id); document.title = 'Everywhere Cars' }
  }, [])

  const markSeen = () => {
    const now = new Date().toISOString()
    lastSeenRef.current = now
    localStorage.setItem('adminLastSeen', now)
  }

  return (
    <div style={{ background: T.pageBg, minHeight: '100vh', display: 'flex', transition: 'background 200ms' }}>
      <style>{`
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.6); }
        }
        .admin-nav-link:hover { background: ${T.sidebarHover} !important; }
      `}</style>

      {/* ── Sidebar — fully theme-aware ──────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: T.sidebarBg,
        color: T.sidebarText,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
        borderRight: `1px solid ${T.sidebarBorder}`,
        transition: 'background 200ms, border-color 200ms',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${T.sidebarBorder}` }}>
          <img src="/logo.png" alt="Everywhere Cars" style={{
            height: 40, width: 'auto', display: 'block', marginBottom: 10,
            filter: T.logoFilter, opacity: 0.92,
            transition: 'filter 200ms',
          }} />
          <div style={{
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            color: T.wordmarkColor, fontWeight: 700, lineHeight: 1.2,
            transition: 'color 200ms',
          }}>
            Everywhere Transfers
          </div>
          <div style={{
            fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase',
            color: T.submarkColor, fontWeight: 500, marginTop: 3,
            transition: 'color 200ms',
          }}>
            Admin Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const badge = item.badgeKey ? counts[item.badgeKey] : 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="admin-nav-link"
                onClick={item.to === '/admin/orders' ? markSeen : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 12px', margin: '2px 0', borderRadius: 8,
                  color: isActive ? T.sidebarActiveText : T.sidebarText,
                  background: isActive ? T.sidebarActiveBg : 'transparent',
                  fontSize: 13, fontWeight: isActive ? 600 : 400, letterSpacing: 0.1,
                  textDecoration: 'none', transition: 'background 120ms, color 120ms',
                })}
              >
                <item.icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.liveDot && badge > 0 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: 999, background: T.sidebarDotBg,
                      animation: 'liveDotPulse 1.6s ease infinite', flexShrink: 0,
                    }} />
                    <span style={{
                      background: T.sidebarBadgeBg, color: T.sidebarBadgeText,
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                      minWidth: 18, textAlign: 'center', lineHeight: '15px',
                    }}>{badge}</span>
                  </span>
                ) : !item.liveDot && badge > 0 ? (
                  <span style={{
                    background: T.sidebarBadgeBg, color: T.sidebarBadgeText,
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                    minWidth: 18, textAlign: 'center', lineHeight: '15px',
                  }}>{badge}</span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: T.sidebarAvatarBg,
              border: `1px solid ${T.sidebarAvatarBorder}`,
              color: T.sidebarAvatarText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 12, letterSpacing: 0.5, flexShrink: 0,
              transition: 'background 200ms, border-color 200ms',
            }}>
              {(user?.name || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: T.wordmarkColor,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{
                fontSize: 10, color: T.sidebarTextMuted,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '7px 10px', background: 'transparent',
              border: `1px solid ${T.sidebarLogoutBorder}`,
              color: T.sidebarLogoutText,
              borderRadius: 7, fontSize: 11, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', letterSpacing: 0.3,
              transition: 'border-color 200ms, color 200ms',
            }}
          >
            <FiLogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: T.headerBg,
          borderBottom: `1px solid ${T.headerBorder}`,
          padding: '0 24px', height: 52,
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 10,
          transition: 'background 200ms, border-color 200ms',
        }}>
          <div style={{ flex: 1 }} />

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px',
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
            borderRadius: 999, fontSize: 11, color: T.textSub, letterSpacing: 0.3,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: T.text,
              animation: 'liveDotPulse 2s ease infinite', display: 'inline-block',
            }} />
            Live
          </div>

          {/* Dark / light toggle */}
          <button
            onClick={toggle}
            title={T.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.headerBg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textSub,
              transition: 'background 200ms, border-color 200ms',
            }}
            aria-label="Toggle theme"
          >
            {T.isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              position: 'relative', width: 36, height: 36, borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.headerBg,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textSub, transition: 'background 200ms',
            }}
            aria-label="Notifications"
          >
            <FiBell size={15} />
            {counts.newOrders > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: T.btnBg, color: T.btnText,
                fontSize: 9, fontWeight: 700, minWidth: 17, height: 17,
                borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: `2px solid ${T.headerBg}`,
              }}>{counts.newOrders}</span>
            )}
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AdminPortalLayout() {
  return (
    <AdminThemeProvider>
      <AdminPortalInner />
    </AdminThemeProvider>
  )
}
