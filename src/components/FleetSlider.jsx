import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'

const FLEET_IMAGES = [
  { src: '/images/fleet-sedan.png',      label: 'Executive Sedan' },
  { src: '/images/fleet-suv.png',        label: 'Premium SUV' },
  { src: '/images/fleet-sprinter.png',   label: 'Mercedes Sprinter' },
  { src: '/images/fleet-coach.png',      label: 'Luxury Coach' },
  { src: '/images/fleet-limo.png',       label: 'Stretch Limousine' },
  { src: '/images/fleet-minibus.png',    label: 'Mini Bus' },
  { src: '/images/fleet-suv2.png',       label: 'Black SUV' },
  { src: '/images/fleet-sedan2.png',     label: 'City Sedan' },
  { src: '/images/fleet-sprinter2.png',  label: 'Group Sprinter' },
  { src: '/images/fleet-suv3.png',       label: 'Full-Size SUV' },
  { src: '/images/fleet-coach-2.png',    label: 'Luxury Coach' },
  { src: '/images/fleet-coach-3.png',    label: 'Luxury Coach' },
  { src: '/images/fleet-coach-4.png',    label: 'Luxury Coach' },
  { src: '/images/fleet-limo-2.png',     label: 'Stretch Limousine' },
  { src: '/images/fleet-limo-3.png',     label: 'Stretch Limousine' },
  { src: '/images/fleet-limo-4.png',     label: 'Stretch Limousine' },
  { src: '/images/fleet-sedan-3.png',    label: 'City Sedan' },
  { src: '/images/fleet-sedan-4.png',    label: 'City Sedan' },
  { src: '/images/fleet-sedan-5.png',    label: 'City Sedan' },
  { src: '/images/fleet-minibus-2.png',  label: 'Group Shuttle' },
  { src: '/images/fleet-minibus-3.png',  label: 'Group Shuttle' },
  { src: '/images/fleet-minibus-4.png',  label: 'Group Shuttle' },
  { src: '/images/fleet-suv-4.png',      label: 'Full-Size SUV' },
  { src: '/images/fleet-suv-5.png',      label: 'Full-Size SUV' },
  { src: '/images/fleet-suv-6.png',      label: 'Full-Size SUV' },
  { src: '/images/fleet-sprinter-3.png', label: 'Mercedes Sprinter' },
  { src: '/images/fleet-sprinter-4.png', label: 'Mercedes Sprinter' },
  { src: '/images/fleet-sprinter-5.png', label: 'Mercedes Sprinter' },
]

export default function FleetSlider() {
  const duplicated = [...FLEET_IMAGES, ...FLEET_IMAGES]

  return (
    <>
      <style>{`
        @keyframes fleet-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .fleet-track {
          animation: fleet-scroll 45s linear infinite;
        }
        .fleet-track:hover { animation-play-state: paused; }
        .fleet-mask {
          mask: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        .fleet-card {
          transition: transform 300ms ease, filter 300ms ease;
        }
        .fleet-card:hover {
          transform: scale(1.04);
          filter: brightness(1.08);
        }
      `}</style>

      <section style={{ background: '#ffffff', padding: '0 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 36px', textAlign: 'center', background: '#ffffff' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(0,0,0,0.5)', marginBottom: 12 }}>
            Our Fleet
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#000000', letterSpacing: -0.5, marginBottom: 10 }}>
            From Sedans to Coach Buses
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.65)', maxWidth: 520, margin: '0 auto 22px', lineHeight: 1.6 }}>
            Every vehicle in our network is professionally maintained, late-model, and chauffeur-driven.
          </p>
          <Link
            to="/fleet"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: '#000000', color: '#ffffff',
              fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
              borderRadius: 999, textDecoration: 'none',
              transition: 'transform 150ms ease, opacity 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1' }}
          >
            View Full Fleet <FiArrowRight />
          </Link>
        </div>

        <div className="fleet-mask" style={{ width: '100%', overflow: 'hidden' }}>
          <div className="fleet-track" style={{ display: 'flex', gap: 20, width: 'max-content' }}>
            {duplicated.map((item, idx) => (
              <div
                key={idx}
                className="fleet-card"
                style={{
                  flexShrink: 0,
                  width: 'clamp(220px, 28vw, 340px)',
                  height: 'clamp(140px, 18vw, 220px)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '24px 16px 12px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
