import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiInbox, FiTag, FiTruck, FiDollarSign, FiUser,
  FiLogOut, FiBell, FiZap,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const NAVY = '#0f1f3d'
const NAVY_DEEP = '#0a1628'
const GOLD = '#F6C90E'
const ELECTRIC = '#0EA5E9'

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

  // Poll every 5s for new orders + offer counts
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
        const bids = bidsRes.data?.data || []

        // Detect brand new orders since last seen — only fire toast for ones we haven't seen before
        const fresh = []
        for (const o of orders) {
          if (!knownIdsRef.current.has(o.id) && new Date(o.created_at) > new Date(lastSeenRef.current)) {
            fresh.push(o)
            knownIdsRef.current.add(o.id)
          } else {
            knownIdsRef.current.add(o.id)
          }
        }
        if (fresh.length) {
          localStorage.setItem('adminKnownOrderIds', JSON.stringify([...knownIdsRef.current]))
          fresh.forEach(o => {
            toast.success(`New ride: ${o.pickup} → ${o.dropoff}`, {
              icon: '🚖',
              style: { background: NAVY_DEEP, color: '#fff', border: `1px solid ${GOLD}` },
            })
          })
        }

        const newOrdersCount = orders.filter(o => {
          // count un-bid-by-me, not yet confirmed orders as "new"
          const myBid = bids.find(b => b.quote_request_id === o.id)
          return !myBid && o.status !== 'confirmed' && o.status !== 'completed' && o.status !== 'booked'
        }).length

        const liveFeedCount = orders.filter(o => {
          const myBid = bids.find(b => b.quote_request_id === o.id)
          return !myBid && o.status !== 'confirmed' && o.status !== 'completed' && o.status !== 'booked'
        }).length
        setCounts({
          liveFeed: liveFeedCount,
          newOrders: newOrdersCount,
          pendingOffers: bids.filter(b => b.status === 'pending').length,
          confirmedTrips: bids.filter(b => b.status === 'accepted').length,
        })

        // Update document title with badge
        if (newOrdersCount > 0) {
          document.title = `(${newOrdersCount}) New Orders · Everywhere Transfers`
        } else {
          document.title = 'Everywhere Transfers · Admin Portal'
        }
      } catch (err) {
        // Silent fail on polling errors
      }
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => { stopped = true; clearInterval(id); document.title = 'Everywhere Cars' }
  }, [])

  // Mark "seen" timestamp when admin visits Orders page
  const markSeen = () => {
    const now = new Date().toISOString()
    lastSeenRef.current = now
    localStorage.setItem('adminLastSeen', now)
  }

  return (
    <div style={{ background: '#f4f5f8', minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @keyframes liveDotPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.35); }
          50% { box-shadow: 0 0 0 5px rgba(34,197,94,0.0); }
        }
      `}</style>
      {/* Sidebar */}
      <aside
        style={{
          width: 256,
          background: NAVY_DEEP,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          borderRight: `1px solid rgba(255,255,255,0.05)`,
        }}
      >
        {/* Brand */}
        <div style={{ padding: '22px 22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${GOLD}, #d4a90c)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: NAVY_DEEP, fontWeight: 900, fontSize: 18, fontFamily: 'monospace',
                boxShadow: `0 4px 14px rgba(246,201,14,0.35)`,
              }}
            >ET</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.3 }}>Everywhere</div>
              <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Transfers</div>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>
            Provider Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const badge = item.badgeKey ? counts[item.badgeKey] : 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={item.to === '/admin/orders' ? markSeen : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  margin: '3px 0',
                  borderRadius: 10,
                  color: isActive ? NAVY_DEEP : 'rgba(255,255,255,0.78)',
                  background: isActive ? GOLD : 'transparent',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  transition: 'background 120ms ease, color 120ms ease',
                  position: 'relative',
                })}
              >
                <item.icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.liveDot && badge > 0 ? (
                  <span style={{
                    width: 9, height: 9, borderRadius: 999, background: '#22c55e',
                    boxShadow: '0 0 0 2px rgba(34,197,94,0.35)',
                    animation: 'liveDotPulse 1.4s ease infinite',
                    flexShrink: 0,
                  }} />
                ) : !item.liveDot && badge > 0 ? (
                  <span style={{
                    background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 999, minWidth: 20, textAlign: 'center', lineHeight: '14px',
                  }}>{badge}</span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 999,
                background: `${ELECTRIC}30`, color: ELECTRIC,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
              }}
            >
              {(user?.name || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer',
            }}
          >
            <FiLogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: '#f4f5f8',
              borderRadius: 999,
              fontSize: 12,
              color: '#475569',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22c55e' }} />
            Live
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              position: 'relative',
              width: 38, height: 38,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569',
            }}
            aria-label="Notifications"
          >
            <FiBell size={16} />
            {counts.newOrders > 0 && (
              <span
                style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  minWidth: 18, height: 18,
                  borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}
              >{counts.newOrders}</span>
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
