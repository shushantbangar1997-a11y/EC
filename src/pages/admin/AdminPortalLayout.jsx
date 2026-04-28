import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiInbox, FiTag, FiTruck, FiDollarSign, FiUser,
  FiLogOut, FiBell, FiZap, FiSun, FiMoon,
  FiChevronLeft, FiChevronRight, FiSearch,
  FiUsers, FiTrendingUp, FiMessageSquare,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { AdminThemeProvider, useAdminTheme } from '../../context/AdminThemeContext'
import api from '../../utils/api'

const EASING = 'cubic-bezier(0.25, 1.1, 0.4, 1)'

const NAV_GROUPS = [
  {
    label: 'Live',
    items: [
      { to: '/admin/live-feed', label: 'Live Feed', icon: FiZap, badgeKey: 'liveFeed', liveDot: true },
    ],
  },
  {
    label: 'Leads',
    items: [
      { to: '/admin/leads',     label: 'All Leads', icon: FiUsers,       badgeKey: 'totalLeads' },
      { to: '/admin/leads/hot', label: 'Hot Leads', icon: FiTrendingUp,  badgeKey: 'hotLeads', liveDot: true },
    ],
  },
  {
    label: 'Chat',
    items: [
      { to: '/admin/live-chat', label: 'Live Chat', icon: FiMessageSquare, badgeKey: 'activeVisitors', liveDot: true },
    ],
  },
  {
    label: 'Orders',
    items: [
      { to: '/admin/orders',  label: 'New Orders', icon: FiInbox,     badgeKey: 'newOrders' },
      { to: '/admin/offers',  label: 'My Offers',  icon: FiTag,       badgeKey: 'pendingOffers' },
      { to: '/admin/trips',   label: 'Trips',      icon: FiTruck,     badgeKey: 'confirmedTrips' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/admin/earnings', label: 'Earnings', icon: FiDollarSign },
      { to: '/admin/profile',  label: 'Profile',  icon: FiUser },
    ],
  },
]

function AdminPortalInner() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme: T, toggle } = useAdminTheme()
  const [counts, setCounts] = useState({
    liveFeed: 0, newOrders: 0, pendingOffers: 0, confirmedTrips: 0,
    totalLeads: 0, hotLeads: 0, activeVisitors: 0,
  })
  const [collapsed, setCollapsed] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const lastSeenRef = useRef(localStorage.getItem('adminLastSeen') || new Date().toISOString())
  const knownIdsRef = useRef(new Set(JSON.parse(localStorage.getItem('adminKnownOrderIds') || '[]')))

  const handleLogout = () => { logout(); navigate('/login') }

  useEffect(() => {
    let stopped = false
    const tick = async () => {
      try {
        const [ordersRes, bidsRes, leadsRes, chatRes] = await Promise.all([
          api.get('/admin/orders', { params: { limit: 100 } }),
          api.get('/admin/my-bids'),
          api.get('/admin/leads').catch(() => ({ data: { counts: {} } })),
          api.get('/chat/sessions').catch(() => ({ data: { online_count: 0 } })),
        ])
        if (stopped) return
        const orders = ordersRes.data?.data || []
        const bids   = bidsRes.data?.data  || []
        const leadCounts = leadsRes.data?.counts || {}

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
          totalLeads:     leadCounts.total || 0,
          hotLeads:       leadCounts.hot   || 0,
          activeVisitors: chatRes.data?.online_count || 0,
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

  const sidebarW = collapsed ? 64 : 228

  return (
    <div style={{ background: T.pageBg, minHeight: '100vh', display: 'flex', transition: 'background 200ms' }}>
      <style>{`
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.6); }
        }
        .adm-nav:hover { background: ${T.sidebarHover} !important; }
        .adm-search-wrap { transition: all 500ms ${EASING}; }
      `}</style>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: T.sidebarBg,
        borderRight: `1px solid ${T.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
        transition: `width 500ms ${EASING}, min-width 500ms ${EASING}, background 200ms, border-color 200ms`,
        overflow: 'hidden',
      }}>

        {/* ── Brand header ───────────────────────────────────────────────── */}
        <div style={{
          padding: collapsed ? '16px 0 14px' : '14px 14px 12px',
          borderBottom: `1px solid ${T.sidebarBorder}`,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          transition: `padding 500ms ${EASING}`,
        }}>
          {/* Logo + wordmark */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            overflow: 'hidden', minWidth: 0, flex: collapsed ? 'none' : 1,
          }}>
            <img
              src="/logo.png?v=4"
              alt="Everywhere Cars"
              style={{
                height: 28, width: 'auto', flexShrink: 0,
                filter: T.logoFilter,
                transition: 'filter 200ms',
              }}
            />
            <div style={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
              overflow: 'hidden', whiteSpace: 'nowrap',
              transition: `opacity 400ms ${EASING}, width 500ms ${EASING}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.wordmarkColor, letterSpacing: 0.2, lineHeight: 1.2 }}>
                Everywhere Cars
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 500, color: T.submarkColor, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>
                Admin Portal
              </div>
            </div>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              border: `1px solid ${T.sidebarBorder}`,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.sidebarTextMuted,
              transition: `opacity 200ms, color 200ms`,
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
          </button>
        </div>

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: collapsed ? '10px 0' : '10px 10px',
          transition: `padding 500ms ${EASING}`,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            background: T.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${T.sidebarBorder}`,
            borderRadius: 8, height: 34,
            display: 'flex', alignItems: 'center',
            width: collapsed ? 34 : '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            overflow: 'hidden',
            transition: `width 500ms ${EASING}`,
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, width: 32, color: T.sidebarTextMuted,
            }}>
              <FiSearch size={13} />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              tabIndex={collapsed ? -1 : 0}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12.5, color: T.sidebarText, paddingRight: 8,
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                transition: `opacity 300ms ${EASING}`,
              }}
            />
          </div>
        </div>

        {/* ── Nav groups ─────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '4px 0' : '4px 8px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              {/* Section label */}
              <div style={{
                height: collapsed ? 0 : 28,
                opacity: collapsed ? 0 : 1,
                overflow: 'hidden',
                padding: collapsed ? '0 12px' : '6px 12px 2px',
                transition: `height 400ms ${EASING}, opacity 300ms ${EASING}`,
              }}>
                <span style={{
                  fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2,
                  textTransform: 'uppercase', color: T.sidebarTextMuted,
                }}>
                  {group.label}
                </span>
              </div>

              {group.items.map(item => {
                const badge = item.badgeKey ? counts[item.badgeKey] : 0
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="adm-nav"
                    onClick={item.to === '/admin/orders' ? markSeen : undefined}
                    title={collapsed ? item.label : undefined}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? '0' : '0 10px',
                      margin: '1px 0',
                      height: 36,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      color: isActive ? T.sidebarActiveText : T.sidebarText,
                      background: isActive ? T.sidebarActiveBg : 'transparent',
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      textDecoration: 'none',
                      transition: `background 150ms, color 150ms, padding 500ms ${EASING}`,
                      position: 'relative', overflow: 'hidden',
                    })}
                  >
                    {/* Icon */}
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16 }}>
                      <item.icon size={15} />
                    </span>

                    {/* Label */}
                    <span style={{
                      flex: 1, whiteSpace: 'nowrap', overflow: 'hidden',
                      opacity: collapsed ? 0 : 1,
                      maxWidth: collapsed ? 0 : 200,
                      transition: `opacity 300ms ${EASING}, max-width 500ms ${EASING}`,
                    }}>
                      {item.label}
                    </span>

                    {/* Badge / live-dot */}
                    {!collapsed && item.liveDot && badge > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: 999,
                          background: T.sidebarDotBg,
                          animation: 'liveDotPulse 1.6s ease infinite',
                        }} />
                        <span style={{
                          background: T.sidebarBadgeBg, color: T.sidebarBadgeText,
                          fontSize: 10, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 999, minWidth: 18, textAlign: 'center', lineHeight: '15px',
                        }}>{badge}</span>
                      </span>
                    )}
                    {!collapsed && !item.liveDot && badge > 0 && (
                      <span style={{
                        background: T.sidebarBadgeBg, color: T.sidebarBadgeText,
                        fontSize: 10, fontWeight: 700, padding: '1px 6px',
                        borderRadius: 999, minWidth: 18, textAlign: 'center',
                        lineHeight: '15px', flexShrink: 0,
                      }}>{badge}</span>
                    )}

                    {/* Collapsed badge dot */}
                    {collapsed && badge > 0 && (
                      <span style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 7, height: 7, borderRadius: 999,
                        background: T.sidebarBadgeBg,
                        animation: item.liveDot ? 'liveDotPulse 1.6s ease infinite' : 'none',
                      }} />
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── User footer ────────────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${T.sidebarBorder}`,
          padding: collapsed ? '12px 0' : '12px 12px',
          display: 'flex', flexDirection: 'column', gap: 8,
          transition: `padding 500ms ${EASING}`,
        }}>
          {/* Avatar row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            overflow: 'hidden',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999, flexShrink: 0,
              background: T.sidebarAvatarBg,
              border: `1px solid ${T.sidebarAvatarBorder}`,
              color: T.sidebarAvatarText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
            }}>
              {(user?.name || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div style={{
              minWidth: 0, flex: 1,
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 200,
              overflow: 'hidden',
              transition: `opacity 300ms ${EASING}, max-width 500ms ${EASING}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.wordmarkColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 10, color: T.sidebarTextMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: '100%', height: 32,
              background: 'transparent',
              border: `1px solid ${T.sidebarLogoutBorder}`,
              color: T.sidebarLogoutText,
              borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', fontSize: 11, fontWeight: 500, letterSpacing: 0.3,
              transition: 'border-color 200ms, color 200ms',
            }}
          >
            <FiLogOut size={12} />
            <span style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 80,
              overflow: 'hidden', whiteSpace: 'nowrap',
              transition: `opacity 300ms ${EASING}, max-width 500ms ${EASING}`,
            }}>
              Sign Out
            </span>
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
