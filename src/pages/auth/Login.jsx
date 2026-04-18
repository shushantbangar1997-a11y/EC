import React, { useState } from 'react'
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
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Logo / brand */}
      <Link to="/" style={{ marginBottom: 32, display: 'block', textDecoration: 'none' }}>
        <img src="/logo.png?v=4" alt="Everywhere Transfers" style={{ height: 30, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
      </Link>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#ffffff',
        borderRadius: 16,
        padding: '36px 32px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', marginBottom: 4, letterSpacing: -0.3 }}>
          {isAdmin ? 'Admin Login' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 13, color: '#737373', marginBottom: 28 }}>
          {isAdmin ? 'Sign in to the admin portal' : 'Sign in to your Everywhere Transfers account'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 14, color: '#171717', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#171717', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 40px 11px 36px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 14, color: '#171717', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            marginTop: 4,
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
            {loading ? 'Signing in…' : <><span>Log In</span><FiArrowRight size={14} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#525252' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link>
        </p>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
        Questions? <a href="mailto:support@everywheretransfers.com" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>support@everywheretransfers.com</a>
      </p>
    </div>
  )
}

export default Login
