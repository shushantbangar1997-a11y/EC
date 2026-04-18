import React, { useState } from 'react'
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

  const inputStyle = {
    width: '100%', padding: '11px 12px 11px 36px',
    border: '1.5px solid #e5e5e5', borderRadius: 8,
    fontSize: 14, color: '#171717', background: '#fafafa',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms',
  }
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#171717',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const iconStyle = {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: '#a3a3a3', pointerEvents: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Brand logo */}
      <Link to="/" style={{ marginBottom: 32, display: 'block', textDecoration: 'none' }}>
        <img src="/logo.png?v=4" alt="Everywhere Transfers" style={{ height: 30, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
      </Link>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#ffffff',
        borderRadius: 16,
        padding: '36px 32px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', marginBottom: 4, letterSpacing: -0.3 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: '#737373', marginBottom: 28 }}>
          Join Everywhere Transfers — free to sign up
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <FiUser size={15} style={iconStyle} />
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="John Doe" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail size={15} style={iconStyle} />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="you@example.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone</label>
            <div style={{ position: 'relative' }}>
              <FiPhone size={15} style={iconStyle} />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="+1 (555) 123-4567" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={iconStyle} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="Min. 8 characters" style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: 0, display: 'flex' }}>
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>

            {/* Strength meter */}
            {strength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#a3a3a3' }}>Password strength</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: strength.color }}>{strength.label}</span>
                </div>
                <div style={{ height: 4, background: '#e5e5e5', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength.pct, background: strength.color, borderRadius: 99, transition: 'width 300ms' }} />
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
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={iconStyle} />
              <input type={showConfirm ? 'text' : 'password'} name="password_confirm" value={formData.password_confirm} onChange={handleChange}
                placeholder="••••••••" style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: 0, display: 'flex' }}>
                {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
            {formData.password_confirm && (
              <p style={{ marginTop: 4, fontSize: 11, color: formData.password === formData.password_confirm ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiCheck size={11} />
                {formData.password === formData.password_confirm ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            marginTop: 8,
            width: '100%', padding: '13px 16px',
            background: loading ? '#525252' : '#0a0a0a',
            color: '#ffffff', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 150ms',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#262626' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0a0a0a' }}
          >
            {loading ? 'Creating account…' : <><span>Create Account</span><FiArrowRight size={14} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#525252' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
        </p>

        <p style={{ marginTop: 20, fontSize: 11, color: '#a3a3a3', textAlign: 'center', lineHeight: 1.5 }}>
          By creating an account you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
        Questions? <a href="mailto:support@everywheretransfers.com" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>support@everywheretransfers.com</a>
      </p>
    </div>
  )
}

export default Signup
