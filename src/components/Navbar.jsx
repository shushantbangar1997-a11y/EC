import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  FiMenu, FiX, FiUser, FiPhone, FiBriefcase, FiArrowRight,
  FiChevronDown, FiNavigation, FiClock, FiAward, FiTruck,
  FiHelpCircle, FiLogOut, FiSettings,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const PHONE      = '(718) 658-6000'
const PHONE_HREF = 'tel:+17186586000'

const SERVICE_LINKS = [
  { to: '/services/airport-transfers', label: 'Airport Transfers', icon: FiNavigation, desc: 'JFK, LGA, EWR & more' },
  { to: '/services/hourly',            label: 'Hourly Chauffeur',  icon: FiClock,      desc: 'As-directed service' },
  { to: '/services/events',            label: 'Event Transportation', icon: FiAward,   desc: 'Weddings, galas & more' },
  { to: '/corporate',                  label: 'Corporate Travel',  icon: FiBriefcase,  desc: 'Managed corporate accounts' },
]

const EXPLORE_LINKS = [
  { to: '/fleet',       label: 'Our Fleet',    icon: FiTruck,      desc: 'Sedans, SUVs, Sprinters & Coaches' },
  { to: '/how-it-works', label: 'How It Works', icon: FiHelpCircle, desc: 'Book in 3 simple steps' },
  { to: '/corporate',   label: 'Corporate',    icon: FiBriefcase,  desc: 'Business accounts & billing' },
]

const ROUTE_LINKS = [
  { to: '/transfers/jfk-to-manhattan',      label: 'JFK → Manhattan' },
  { to: '/transfers/lga-to-manhattan',      label: 'LGA → Manhattan' },
  { to: '/transfers/ewr-to-manhattan',      label: 'EWR → Manhattan' },
  { to: '/transfers/jfk-to-brooklyn',       label: 'JFK → Brooklyn' },
  { to: '/transfers/manhattan-to-hamptons', label: 'Manhattan → Hamptons' },
  { to: '/transfers/nyc-to-philadelphia',   label: 'NYC → Philadelphia' },
  { to: '/transfers/nyc-to-connecticut',    label: 'NYC → Connecticut' },
  { to: '/transfers/nyc-to-boston',         label: 'NYC → Boston' },
]

function DropdownShell({ children }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
      background: '#ffffff', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
      border: '1px solid #e5e5e5', zIndex: 60, overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function NavDropItem({ to, icon: Icon, label, desc, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textDecoration: 'none', transition: 'background 120ms' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color="#ffffff" />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#a3a3a3', marginTop: 1 }}>{desc}</div>}
      </div>
    </Link>
  )
}

function ServicesDropdown({ onClose }) {
  return (
    <DropdownShell>
      <div style={{ padding: '8px 0', width: 270 }}>
        <p style={{ padding: '6px 16px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#a3a3a3' }}>Our Services</p>
        {SERVICE_LINKS.map(l => <NavDropItem key={l.to} {...l} onClick={onClose} />)}
        <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 12px 4px' }} />
        <Link to="/services" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#171717', textDecoration: 'none', padding: '8px 0' }}>
          View all services <FiArrowRight size={11} />
        </Link>
      </div>
    </DropdownShell>
  )
}

function ExploreDropdown({ onClose }) {
  return (
    <DropdownShell>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: 460 }}>
        <div style={{ borderRight: '1px solid #f0f0f0', padding: '8px 0' }}>
          <p style={{ padding: '6px 16px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#a3a3a3' }}>Explore</p>
          {EXPLORE_LINKS.map(l => <NavDropItem key={l.to} {...l} onClick={onClose} />)}
        </div>
        <div style={{ padding: '8px 0' }}>
          <p style={{ padding: '6px 16px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#a3a3a3' }}>Popular Routes</p>
          {ROUTE_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={onClose}
              style={{ display: 'block', padding: '7px 16px', fontSize: 12, color: '#525252', textDecoration: 'none', transition: 'background 120ms, color 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#171717' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </DropdownShell>
  )
}

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen,       setIsMenuOpen]       = useState(false)
  const [isProfileOpen,    setIsProfileOpen]    = useState(false)
  const [isServicesOpen,   setIsServicesOpen]   = useState(false)
  const [isExploreOpen,    setIsExploreOpen]    = useState(false)
  const [mobileServices,   setMobileServices]   = useState(false)
  const [mobileExplore,    setMobileExplore]    = useState(false)
  const servicesRef = useRef(null)
  const exploreRef  = useRef(null)
  const profileRef  = useRef(null)

  const closeAll = () => {
    setIsMenuOpen(false); setIsProfileOpen(false)
    setIsServicesOpen(false); setIsExploreOpen(false)
    setMobileServices(false); setMobileExplore(false)
  }
  const handleLogout = () => { logout(); closeAll(); navigate('/') }

  useEffect(() => {
    const handleClick = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) setIsServicesOpen(false)
      if (exploreRef.current  && !exploreRef.current.contains(e.target))  setIsExploreOpen(false)
      if (profileRef.current  && !profileRef.current.contains(e.target))  setIsProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const linkStyle = { fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.72)', textDecoration: 'none', padding: '4px 2px', transition: 'color 120ms', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }
  const hoverLink = e => { e.currentTarget.style.color = '#ffffff' }
  const leaveLink = e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)' }

  const desktopLinks = () => {
    if (user?.role === 'operator' || user?.role === 'admin') {
      return <>
        <Link to="/admin/live-feed" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Dashboard</Link>
        <div className="relative" ref={servicesRef}>
          <button style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}
            onClick={() => { setIsServicesOpen(o => !o); setIsExploreOpen(false) }}>
            Services <FiChevronDown size={12} style={{ transform: isServicesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
          {isServicesOpen && <ServicesDropdown onClose={() => setIsServicesOpen(false)} />}
        </div>
      </>
    }
    if (isAuthenticated) return <>
      <Link to="/book"     style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Book a Ride</Link>
      <Link to="/my-rides" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>My Rides</Link>
      <div className="relative" ref={servicesRef}>
        <button style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}
          onClick={() => { setIsServicesOpen(o => !o); setIsExploreOpen(false) }}>
          Services <FiChevronDown size={12} />
        </button>
        {isServicesOpen && <ServicesDropdown onClose={() => setIsServicesOpen(false)} />}
      </div>
      <div className="relative" ref={exploreRef}>
        <button style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}
          onClick={() => { setIsExploreOpen(o => !o); setIsServicesOpen(false) }}>
          Explore <FiChevronDown size={12} />
        </button>
        {isExploreOpen && <ExploreDropdown onClose={() => setIsExploreOpen(false)} />}
      </div>
    </>
    return <>
      <div className="relative" ref={servicesRef}>
        <button style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}
          onClick={() => { setIsServicesOpen(o => !o); setIsExploreOpen(false) }}>
          Services <FiChevronDown size={12} />
        </button>
        {isServicesOpen && <ServicesDropdown onClose={() => setIsServicesOpen(false)} />}
      </div>
      <div className="relative" ref={exploreRef}>
        <button style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}
          onClick={() => { setIsExploreOpen(o => !o); setIsServicesOpen(false) }}>
          Explore <FiChevronDown size={12} />
        </button>
        {isExploreOpen && <ExploreDropdown onClose={() => setIsExploreOpen(false)} />}
      </div>
      <Link to="/quote" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Get a Quote</Link>
    </>
  }

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

        {/* Logo */}
        <Link to="/" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
          <img src="/logo.png?v=4" alt="Everywhere Transfers" style={{ height: 34, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }} className="hidden md:flex">
          {desktopLinks()}
        </div>

        {/* Desktop right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden md:flex">
          <a href={PHONE_HREF} style={{ ...linkStyle, gap: 6, marginRight: 4 }} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>
            <FiPhone size={13} />
            <span style={{ display: 'none' }} className="lg:inline">{PHONE}</span>
          </a>

          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button onClick={() => setIsProfileOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 8, cursor: 'pointer',
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 999, background: '#ffffff', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                <FiChevronDown size={12} style={{ color: 'rgba(255,255,255,0.6)', transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
              </button>
              {isProfileOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#ffffff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', border: '1px solid #e5e5e5', padding: '6px 0', minWidth: 200, zIndex: 60 }}>
                  <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#171717', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                    <p style={{ fontSize: 11, color: '#a3a3a3', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', fontSize: 13, color: '#525252', textDecoration: 'none', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <FiSettings size={13} /> My Profile
                  </Link>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 16px', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <FiLogOut size={13} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link to="/login" state={{ adminLogin: true }} style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.72)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, transition: 'color 120ms, border-color 120ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}>
                <FiUser size={12} style={{ display: 'inline', marginRight: 5, marginBottom: -1 }} />
                Admin
              </Link>
              <Link to="/signup" style={{ padding: '7px 16px', fontSize: 13, fontWeight: 700, color: '#0a0a0a', background: '#ffffff', textDecoration: 'none', borderRadius: 8, letterSpacing: 0.1, transition: 'background 120ms' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e5e5e5'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
                Book Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setIsMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer', color: '#ffffff' }} className="md:hidden">
          {isMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div style={{ background: '#0a0a0a', borderTop: '1px solid #1e1e1e', padding: '12px 16px 20px' }} className="md:hidden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isAuthenticated ? (
              <>
                <Link to="/book"     onClick={closeAll} style={{ padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', borderRadius: 8 }}>Book a Ride</Link>
                <Link to="/my-rides" onClick={closeAll} style={{ padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', borderRadius: 8 }}>My Rides</Link>
              </>
            ) : (
              <Link to="/quote" onClick={closeAll} style={{ padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', borderRadius: 8 }}>Get a Quote</Link>
            )}
            <div>
              <button onClick={() => setMobileServices(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Services <FiChevronDown size={14} style={{ transform: mobileServices ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
              </button>
              {mobileServices && (
                <div style={{ paddingLeft: 16, marginBottom: 4 }}>
                  {SERVICE_LINKS.map(({ to, label }) => (
                    <Link key={to} to={to} onClick={closeAll} style={{ display: 'block', padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{label}</Link>
                  ))}
                </div>
              )}
            </div>
            <div>
              <button onClick={() => setMobileExplore(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Explore <FiChevronDown size={14} style={{ transform: mobileExplore ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
              </button>
              {mobileExplore && (
                <div style={{ paddingLeft: 16, marginBottom: 4 }}>
                  {EXPLORE_LINKS.map(({ to, label }) => (
                    <Link key={to} to={to} onClick={closeAll} style={{ display: 'block', padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{label}</Link>
                  ))}
                  <div style={{ margin: '6px 12px', borderTop: '1px solid #2a2a2a' }} />
                  {ROUTE_LINKS.slice(0, 4).map(({ to, label }) => (
                    <Link key={to} to={to} onClick={closeAll} style={{ display: 'block', padding: '7px 12px', fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{label}</Link>
                  ))}
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid #1e1e1e', marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {isAuthenticated ? (
                <button onClick={handleLogout} style={{ padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Log Out</button>
              ) : (
                <>
                  <Link to="/login" onClick={closeAll} style={{ padding: '10px 12px', fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Log In</Link>
                  <Link to="/signup" onClick={closeAll} style={{ padding: '11px 16px', fontSize: 14, fontWeight: 700, color: '#0a0a0a', background: '#ffffff', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>Book Now — Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
