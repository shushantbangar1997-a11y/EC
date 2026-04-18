import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiCheck, FiArrowRight } from 'react-icons/fi'

const Signup = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', password_confirm: '' })

  // Force dark body background on mobile so scrolling never reveals white
  useEffect(() => {
    const prev = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = prev }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getPasswordStrength = () => {
    const p = formData.password
    if (!p) return null
    let score = 0
    if (p.length >= 8) score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: 'Weak', color: '#ef4444', pct: '33%' }
    if (score <= 3) return { label: 'Medium', color: '#f59e0b', pct: '66%' }
    return { label: 'Strong', color: '#22c55e', pct: '100%' }
  }

  const strength = getPasswordStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.password_confirm) {
      toast.error('Please fill in all fields'); return
    }
    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match'); return
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return
    }
    setLoading(true)
    try {
      await register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password })
      const pending = location.state?.fromBidBoard
        ? location.state
        : (() => { try { const s = sessionStorage.getItem('pendingBidBooking'); return s ? JSON.parse(s) : null } catch { return null } })()
      if (pending?.fromBidBoard) {
        try { sessionStorage.removeItem('pendingBidBooking') } catch {}
        toast.success('Account created! Taking you to your booking…')
        setTimeout(() => navigate('/book', { state: pending }), 1200)
      } else {
        toast.success('Account created! Redirecting to login…')
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const field = (label, name, type, placeholder, icon, extra = {}) => (
    <div key={name}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none', display: 'flex' }}>
          {icon}
        </span>
        <input
          type={type} name={name} value={formData[name]} onChange={handleChange}
          placeholder={placeholder} autoComplete={extra.autoComplete}
          style={{ width: '100%', padding: `13px ${extra.pr || '12px'} 13px 38px`, border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#0a0a0a'}
          onBlur={e => e.target.style.borderColor = '#e5e5e5'}
        />
        {extra.toggle}
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh',           /* dynamic viewport — accounts for mobile browser chrome */
      backgroundColor: '#0a0a0a',
      overscrollBehavior: 'none',   /* stop rubber-band scroll revealing white */
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', /* scroll naturally on small screens */
      padding: '48px 16px 48px',
      boxSizing: 'border-box',
    }}>

      {/* Brand logo */}
      <Link to="/" style={{ marginBottom: 36, display: 'block', textDecoration: 'none', flexShrink: 0 }}>
        <img src="/logo.png?v=4" alt="Everywhere Transfers"
          style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9, display: 'block' }} />
      </Link>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 'clamp(24px, 6vw, 36px) clamp(20px, 6vw, 32px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        boxSizing: 'border-box',
      }}>
        <h1 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 800, color: '#0a0a0a', marginBottom: 4, letterSpacing: -0.3, lineHeight: 1.2 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: '#737373', marginBottom: 28, lineHeight: 1.5 }}>
          Join Everywhere Transfers — free to sign up
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <FiUser size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="John Doe" autoComplete="name"
                style={{ width: '100%', padding: '13px 12px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="you@example.com" autoComplete="email" inputMode="email"
                style={{ width: '100%', padding: '13px 12px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Phone</label>
            <div style={{ position: 'relative' }}>
              <FiPhone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="+1 (555) 123-4567" autoComplete="tel" inputMode="tel"
                style={{ width: '100%', padding: '13px 12px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="Min. 8 characters" autoComplete="new-password"
                style={{ width: '100%', padding: '13px 44px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {strength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#a3a3a3' }}>Password strength</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: strength.color }}>{strength.label}</span>
                </div>
                <div style={{ height: 4, backgroundColor: '#e5e5e5', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength.pct, backgroundColor: strength.color, borderRadius: 99, transition: 'width 300ms' }} />
                </div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    [formData.password.length >= 8, 'At least 8 characters'],
                    [/[A-Z]/.test(formData.password), 'One uppercase letter'],
                    [/[0-9]/.test(formData.password), 'One number'],
                  ].map(([ok, text]) => (
                    <span key={text} style={{ fontSize: 11, color: ok ? '#22c55e' : '#a3a3a3', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FiCheck size={11} /> {text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input type={showConfirm ? 'text' : 'password'} name="password_confirm" value={formData.password_confirm} onChange={handleChange}
                placeholder="••••••••" autoComplete="new-password"
                style={{ width: '100%', padding: '13px 44px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {formData.password_confirm && (
              <p style={{ marginTop: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: formData.password === formData.password_confirm ? '#22c55e' : '#ef4444' }}>
                <FiCheck size={11} />
                {formData.password === formData.password_confirm ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              marginTop: 8, width: '100%', padding: '14px 16px',
              backgroundColor: loading ? '#525252' : '#0a0a0a',
              color: '#ffffff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              WebkitTapHighlightColor: 'transparent',
            }}>
            {loading ? 'Creating account…' : <><span>Create Account</span><FiArrowRight size={15} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e5e5' }} />
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e5e5' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#525252' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
        </p>

        <p style={{ marginTop: 16, fontSize: 11, color: '#a3a3a3', textAlign: 'center', lineHeight: 1.5 }}>
          By creating an account you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.28)', textAlign: 'center', lineHeight: 1.6 }}>
        Questions?{' '}
        <a href="mailto:support@everywheretransfers.com" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
          support@everywheretransfers.com
        </a>
      </p>
    </div>
  )
}

export default Signup
