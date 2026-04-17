import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiInbox, FiTag, FiTruck, FiDollarSign, FiUser,
  FiLogOut, FiBell, FiZap,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

// ── Monochrome design tokens ──────────────────────────────────────────────────
const BK  = '#0a0a0a'   // near-black — sidebar bg, primary buttons
const WH  = '#ffffff'   // white — text on black, card bg
const GR50  = '#fafafa' // page bg
const GR100 = '#f5f5f5' // subtle hover
const GR200 = '#e5e5e5' // borders
const GR400 = '#a3a3a3' // muted text
const GR600 = '#525252' // secondary text
const GR900 = '#171717' // primary text

const NAV_ITEMS = [
  { to: '/admin/live-feed', label: 'Live Feed',   icon: FiZap,       badgeKey: 'liveFeed', liveDot: true },
  { to: '/admin/orders',    label: 'New Orders',  icon: FiInbox,     badgeKey: 'newOrders' },
  { to: '/admin/offers',    label: 'My Offers',   icon: FiTag,       badgeKey: 'pendingOffers' },
  { to: '/admin/trips',     label: 'Trips',       icon: FiTruck,     badgeKey: 'confirmedTrips' },
  { to: '/admin/earnings',  label: 'Earnings',    icon: FiDollarSign },
  { to: '/admin/profile',   label: 'Profile',     icon: FiUser },
]

export default function AdminPortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState({ liveFeed: 0, newOrders: 0, pendingOffers: 0, confirmedTrips: 0 })
  const lastSeenRef = useRef(localStorage.getItem('adminLastSeen') || new Date().toISOString())
  const knownIdsRef = useRef(new Set(JSON.parse(localStorage.getItem('adminKnownOrderIds') || '[]')))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
          if (!knownIdsRef.current.has(o.id) && new Date(o.created_at) > new Date(lastSeenRef.current)) {
            fresh.push(o)
          }
          knownIdsRef.current.add(o.id)
        }
        if (fresh.length) {
          localStorage.setItem('adminKnownOrderIds', JSON.stringify([...knownIdsRef.current]))
          fresh.forEach(o => {
            toast.success(`New ride: ${o.pickup} → ${o.dropoff}`, {
              icon: '🚖',
              style: { background: BK, color: WH, border: `1px solid ${GR200}`, borderRadius: 10, fontSize: 13 },
            })
          })
        }

        const unbid = (o) => {
          const myBid = bids.find(b => b.quote_request_id === o.id)
          return !myBid && o.status !== 'confirmed' && o.status !== 'completed' && o.status !== 'booked'
        }

        const liveFeedCount  = orders.filter(unbid).length
        const newOrdersCount = liveFeedCount

        setCounts({
          liveFeed:      liveFeedCount,
          newOrders:     newOrdersCount,
          pendingOffers: bids.filter(b => b.status === 'pending').length,
          confirmedTrips: bids.filter(b => b.status === 'accepted').length,
        })

        document.title = newOrdersCount > 0
          ? `(${newOrdersCount}) New Orders · Everywhere Transfers`
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
    <div style={{ background: GR50, minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.6); }
        }
        .admin-nav-link:hover {
          background: rgba(255,255,255,0.07) !important;
        }
      `}</style>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: BK,
        color: WH,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
        borderRight: `1px solid #1a1a1a`,
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1e1e1e' }}>
          <img
            src="/logo.png"
            alt="Everywhere Cars"
            style={{
              height: 40,
              width: 'auto',
              display: 'block',
              marginBottom: 10,
              filter: 'brightness(0) invert(1)',
              opacity: 0.92,
            }}
          />
          <div style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.88)',
            fontWeight: 700,
            lineHeight: 1.2,
          }}>
            Everywhere Transfers
          </div>
          <div style={{
            fontSize: 9,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            color: GR400,
            fontWeight: 500,
            marginTop: 3,
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '10px 12px',
                  margin: '2px 0',
                  borderRadius: 8,
                  color: isActive ? BK : 'rgba(255,255,255,0.65)',
                  background: isActive ? WH : 'transparent',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: 0.1,
                  textDecoration: 'none',
                  transition: 'background 120ms ease, color 120ms ease',
                })}
              >
                <item.icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>

                {item.liveDot && badge > 0 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: 999,
                      background: WH,
                      animation: 'liveDotPulse 1.6s ease infinite',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      background: WH, color: BK, fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 999, minWidth: 18,
                      textAlign: 'center', lineHeight: '15px',
                    }}>{badge}</span>
                  </span>
                ) : !item.liveDot && badge > 0 ? (
                  <span style={{
                    background: WH, color: BK, fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 999, minWidth: 18,
                    textAlign: 'center', lineHeight: '15px',
                  }}>{badge}</span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: '#1e1e1e', border: '1px solid #2e2e2e',
              color: GR400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 12, letterSpacing: 0.5,
              flexShrink: 0,
            }}>
              {(user?.name || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{
                fontSize: 10, color: GR400,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '7px 10px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              color: GR400,
              borderRadius: 7, fontSize: 11, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer',
              letterSpacing: 0.3,
              transition: 'border-color 120ms, color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = WH }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = GR400 }}
          >
            <FiLogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: WH,
          borderBottom: `1px solid ${GR200}`,
          padding: '0 28px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ flex: 1 }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px',
            background: GR50,
            border: `1px solid ${GR200}`,
            borderRadius: 999,
            fontSize: 11,
            color: GR600,
            letterSpacing: 0.3,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: BK,
              animation: 'liveDotPulse 2s ease infinite',
              display: 'inline-block',
            }} />
            Live
          </div>

          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              position: 'relative',
              width: 36, height: 36,
              borderRadius: 8,
              border: `1px solid ${GR200}`,
              background: WH,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: GR600,
            }}
            aria-label="Notifications"
          >
            <FiBell size={15} />
            {counts.newOrders > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: BK, color: WH,
                fontSize: 9, fontWeight: 700,
                minWidth: 17, height: 17,
                borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
                border: `2px solid ${WH}`,
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
