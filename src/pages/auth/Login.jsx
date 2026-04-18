import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const isAdmin = !!location.state?.adminLogin

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const response = await login(formData.email, formData.password)
      toast.success('Welcome back!')

      const pending = location.state?.fromBidBoard
        ? location.state
        : (() => { try { const s = sessionStorage.getItem('pendingBidBooking'); return s ? JSON.parse(s) : null } catch { return null } })()

      if (pending?.fromBidBoard) {
        try { sessionStorage.removeItem('pendingBidBooking') } catch {}
        navigate('/book', { state: pending })
        return
      }

      if (response?.user?.role === 'admin') navigate('/admin/live-feed')
      else if (response?.user?.role === 'operator') navigate('/operator/dashboard')
      else navigate('/my-rides')
    } catch (error) {
      toast.error(error.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',           /* dynamic viewport — accounts for mobile browser chrome */
      backgroundColor: '#0a0a0a',
      overscrollBehavior: 'none',   /* stop rubber-band scroll revealing white body bg */
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', /* top-align so content scrolls naturally on small screens */
      padding: '48px 16px 40px',
      boxSizing: 'border-box',
    }}>

      {/* Logo / brand */}
      <Link to="/" style={{ marginBottom: 36, display: 'block', textDecoration: 'none', flexShrink: 0 }}>
        <img src="/logo.png?v=4" alt="Everywhere Transfers"
          style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9, display: 'block' }} />
      </Link>

      {/* Card — full-width on mobile, capped on wider screens */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 'clamp(24px, 6vw, 36px) clamp(20px, 6vw, 32px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        boxSizing: 'border-box',
      }}>
        <h1 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 800, color: '#0a0a0a', marginBottom: 4, letterSpacing: -0.3, lineHeight: 1.2 }}>
          {isAdmin ? 'Admin Login' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 13, color: '#737373', marginBottom: 28, lineHeight: 1.5 }}>
          {isAdmin ? 'Sign in to the admin portal' : 'Sign in to your Everywhere Transfers account'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="you@example.com" autoComplete="email" inputMode="email"
                style={{ width: '100%', padding: '13px 12px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" autoComplete="current-password"
                style={{ width: '100%', padding: '13px 44px 13px 38px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, color: '#171717', backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: 4, display: 'flex', alignItems: 'center' }}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              marginTop: 4, width: '100%', padding: '14px 16px',
              backgroundColor: loading ? '#525252' : '#0a0a0a',
              color: '#ffffff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              WebkitTapHighlightColor: 'transparent',
            }}>
            {loading ? 'Signing in…' : <><span>Log In</span><FiArrowRight size={15} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e5e5' }} />
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e5e5' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#525252' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link>
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

export default Login
