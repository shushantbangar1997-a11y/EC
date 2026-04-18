import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiFacebook, FiLinkedin, FiInstagram, FiMail, FiPhone,
  FiMapPin, FiShield, FiUser, FiLock, FiArrowRight,
  FiMessageCircle, FiExternalLink,
} from 'react-icons/fi'

const PHONE     = '(718) 658-6000'
const PHONE_HREF = 'tel:+17186586000'
const EMAIL     = 'booking@everywherecars.com'
const WHATSAPP  = 'https://wa.me/17182196683'
const FACEBOOK  = 'https://www.facebook.com/share/1CVi8FFsRs/'
const INSTAGRAM = 'https://www.instagram.com/everywherecars20'
const LINKEDIN  = 'https://www.linkedin.com/company/everywhere-transportation-inc'

const socialLinks = [
  { icon: FiFacebook,      label: 'Facebook',  href: FACEBOOK  },
  { icon: FiInstagram,     label: 'Instagram', href: INSTAGRAM },
  { icon: FiLinkedin,      label: 'LinkedIn',  href: LINKEDIN  },
  { icon: FiMessageCircle, label: 'WhatsApp',  href: WHATSAPP  },
]

const services = [
  { text: 'Airport Transfers',    to: '/services/airport-transfers' },
  { text: 'Hourly Chauffeur',     to: '/services/hourly' },
  { text: 'Corporate Travel',     to: '/corporate' },
  { text: 'Event Transportation', to: '/services/events' },
  { text: 'View Our Fleet',       to: '/fleet' },
]

const company = [
  { text: 'How It Works',   to: '/how-it-works' },
  { text: 'Book a Ride',    to: '/' },
  { text: 'Operator Login', to: '/login' },
  { text: 'Privacy Policy', to: '/privacy' },
  { text: 'Terms of Service', to: '/terms' },
]

const contactItems = [
  { icon: FiMail,          text: EMAIL,           href: `mailto:${EMAIL}` },
  { icon: FiPhone,         text: PHONE,           href: PHONE_HREF },
  { icon: FiMessageCircle, text: 'WhatsApp Us',   href: WHATSAPP  },
  { icon: FiMapPin,        text: 'New York City, NY', href: null  },
]

const trustBadges = [
  { icon: FiShield, label: 'Licensed & Insured' },
  { icon: FiUser,   label: 'Vetted Chauffeurs' },
  { icon: FiLock,   label: 'Secure & Free to Post' },
]

const MUTED  = 'rgba(255,255,255,0.40)'
const BODY   = 'rgba(255,255,255,0.60)'
const WHITE  = '#ffffff'
const BORDER = 'rgba(255,255,255,0.08)'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail]     = useState('')
  const [submitted, setSub]   = useState(false)

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address'); return }
    setSub(true); setEmail('')
    toast.success("You're in! Your 10% discount code is on its way.")
  }

  const linkHover = (e, out) => { e.currentTarget.style.color = out ? MUTED : WHITE }

  return (
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Newsletter strip */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }} className="md:flex-row md:justify-between">
            <div style={{ textAlign: 'center' }} className="md:text-left">
              <h3 style={{ fontSize: 17, fontWeight: 700, color: WHITE, marginBottom: 4 }}>Get 10% Off Your First Ride</h3>
              <p style={{ fontSize: 13, color: BODY }}>Join our list and receive an exclusive discount code instantly.</p>
            </div>
            {submitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4ade80' }}>
                <FiShield size={14} /> Check your inbox for your discount code!
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row" style={{ gap: 8, width: '100%', maxWidth: 400 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED }} size={13} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: WHITE, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ padding: '10px 18px', background: WHITE, color: '#0a0a0a', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e5e5'}
                  onMouseLeave={e => e.currentTarget.style.background = WHITE}>
                  Get 10% Off <FiArrowRight size={12} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 36, marginBottom: 40 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <img src="/logo.png?v=4" alt="Everywhere Transfers" style={{ height: 40, width: 'auto', display: 'block', marginBottom: 16, filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
            <p style={{ fontSize: 13, color: BODY, lineHeight: 1.7, marginBottom: 20, maxWidth: 230 }}>
              New York's luxury chauffeur marketplace. Post your ride free — operators compete, you choose the best price.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{ width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: MUTED, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.color = WHITE; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>Services</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {services.map(({ text, to }) => (
                <li key={text}>
                  <Link to={to} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', transition: 'color 120ms' }}
                    onMouseEnter={e => linkHover(e, false)} onMouseLeave={e => linkHover(e, true)}>{text}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>Company</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {company.map(({ text, to }) => (
                <li key={text}>
                  <Link to={to} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', transition: 'color 120ms' }}
                    onMouseEnter={e => linkHover(e, false)} onMouseLeave={e => linkHover(e, true)}>{text}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>Contact</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contactItems.map(({ icon: Icon, text, href }) => {
                const inner = <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><Icon size={13} style={{ flexShrink: 0 }} />{text}</span>
                return href ? (
                  <li key={text}>
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      style={{ color: MUTED, textDecoration: 'none', transition: 'color 120ms' }}
                      onMouseEnter={e => linkHover(e, false)} onMouseLeave={e => linkHover(e, true)}>{inner}</a>
                  </li>
                ) : <li key={text} style={{ color: MUTED }}>{inner}</li>
              })}
            </ul>
            <div style={{ marginTop: 20 }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', color: BODY, textDecoration: 'none', transition: 'background 120ms, color 120ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = WHITE }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BODY }}>
                Post a Ride — Free <FiExternalLink size={10} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontSize: 11, color: MUTED }} className="md:flex-row">
          <p>&copy; {currentYear} Everywhere Cars. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                <Icon size={11} style={{ color: 'rgba(255,255,255,0.30)' }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p>
            Powered by{' '}
            <a href="https://everywheretransfers.com" target="_blank" rel="noopener noreferrer"
              style={{ color: BODY, textDecoration: 'none', transition: 'color 120ms' }}
              onMouseEnter={e => e.currentTarget.style.color = WHITE}
              onMouseLeave={e => e.currentTarget.style.color = BODY}>
              Everywhere Transfers
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
