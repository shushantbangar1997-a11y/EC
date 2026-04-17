import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShield, FiTruck, FiHeadphones, FiNavigation, FiCalendar,
  FiUsers, FiBriefcase, FiArrowRight, FiPhone,
} from 'react-icons/fi'
import DispatchPanel from '../components/DispatchPanel'
import HeroSlideshow from '../components/HeroSlideshow'
import useSimulatedStats from '../hooks/useSimulatedStats'

const VEHICLE_OPTIONS = [
  { id: 'sedan',        label: 'Sedan',    icon: '🚗', desc: '2–3 passengers' },
  { id: 'suv',         label: 'SUV',       icon: '🚙', desc: '3–5 passengers' },
  { id: 'sprinter_van', label: 'Sprinter', icon: '🚐', desc: 'Up to 14 passengers' },
  { id: 'coach',       label: 'Coach Bus', icon: '🚌', desc: '20–55 passengers' },
]

const TRUST_ITEMS = [
  { icon: FiShield,      label: 'Licensed & Insured',  desc: 'Every driver fully vetted, licensed, and covered' },
  { icon: FiTruck,       label: '250+ Vehicles',         desc: 'Sedans, SUVs, Sprinters and luxury coaches' },
  { icon: FiHeadphones,  label: '24/7 Live Support',    desc: 'Real humans always available to help' },
]

const SERVICE_PILLS = [
  { label: 'Airport Transfers', icon: FiNavigation, href: '/services/airport-transfers' },
  { label: 'Hourly Chauffeur',  icon: FiCalendar,   href: '/services/hourly' },
  { label: 'Group Events',      icon: FiUsers,      href: '/services/events' },
  { label: 'Corporate',         icon: FiBriefcase,  href: '/corporate' },
]

export default function Home() {
  const stats = useSimulatedStats()
  const [presetVehicle, setPresetVehicle] = useState(null)
  const panelRef = useRef(null)

  const handleVehicleSelect = (vehicleId) => {
    setPresetVehicle(vehicleId)
    setTimeout(() => { panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 50)
  }
  const scrollToBook = () => { panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  return (
    <div style={{ background: '#ffffff' }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <HeroSlideshow />

        {/* Overlays */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }} />
        </div>

        <div ref={panelRef} style={{ position: 'relative', zIndex: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 90px' }}>

          {/* Live stats bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
            padding: '7px 18px', borderRadius: 999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22c55e', flexShrink: 0, display: 'inline-block' }} className="animate-pulse" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.72)' }}>
              <span><span style={{ fontWeight: 700, color: '#ffffff' }}>{stats.vehicles}</span> vehicles ready near NYC</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
              <span>Avg response: <span style={{ fontWeight: 700, color: '#ffffff' }}>{stats.response} min</span></span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }} className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Rides today: <span style={{ fontWeight: 700, color: '#ffffff' }}>{stats.rides}</span></span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#ffffff', textAlign: 'center', letterSpacing: -1, lineHeight: 1.1, marginBottom: 10, maxWidth: 680 }}>
            NYC's Premium<br />Transfer Marketplace
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', textAlign: 'center', maxWidth: 420, marginBottom: 36, lineHeight: 1.6 }}>
            Post your ride free. Operators compete. You pick the best price.
          </p>

          {/* Booking panel */}
          <div style={{
            '--bg-panel': 'rgba(0, 0, 0, 0.55)',
            '--border-panel': '1px solid rgba(255, 255, 255, 0.18)',
            '--bg-field': 'rgba(255, 255, 255, 0.10)',
            '--bg-field-hover': 'rgba(255, 255, 255, 0.16)',
            '--border-field': '1px solid rgba(255, 255, 255, 0.20)',
            '--border-color': 'rgba(255, 255, 255, 0.14)',
            '--stats-bg': 'rgba(255, 255, 255, 0.06)',
            '--bg-surface': 'rgba(10, 10, 10, 0.97)',
            '--text-primary': 'rgba(255, 255, 255, 1)',
            '--text-secondary': 'rgba(255, 255, 255, 0.80)',
            '--text-muted': 'rgba(255, 255, 255, 0.45)',
            width: '100%', maxWidth: 660,
          }}>
            <DispatchPanel presetVehicle={presetVehicle} hideStats />
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e5e5e5', padding: '56px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36 }}>
            {TRUST_ITEMS.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#171717', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#737373', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vehicle picker ──────────────────────────────────────────────── */}
      <section style={{ background: '#fafafa', borderTop: '1px solid #e5e5e5', padding: '56px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#a3a3a3', textAlign: 'center', marginBottom: 20 }}>
            Choose your vehicle — we'll pre-select it in the booking form
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="sm:grid-cols-4">
            {VEHICLE_OPTIONS.map(({ id, label, icon, desc }) => {
              const selected = presetVehicle === id
              return (
                <button key={id} onClick={() => handleVehicleSelect(id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '20px 12px', borderRadius: 12, cursor: 'pointer',
                  background: selected ? '#0a0a0a' : '#ffffff',
                  border: `1.5px solid ${selected ? '#0a0a0a' : '#e5e5e5'}`,
                  transition: 'all 150ms',
                }}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#ffffff' : '#171717', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: selected ? 'rgba(255,255,255,0.6)' : '#a3a3a3' }}>{desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Services CTA ────────────────────────────────────────────────── */}
      <section style={{ background: '#0a0a0a', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
              Popular services
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {SERVICE_PILLS.map(({ label, icon: Icon, href }) => (
                <Link key={label} to={href} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  transition: 'background 120ms, color 120ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}>
                  <Icon size={13} /> {label}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button onClick={scrollToBook} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12,
              background: '#ffffff', color: '#0a0a0a',
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              letterSpacing: 0.1, transition: 'background 120ms',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e5e5'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
              Book Now <FiArrowRight size={16} />
            </button>
            <a href="tel:+17186586000" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 120ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
              <FiPhone size={13} /> (718) 658-6000
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
