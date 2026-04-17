import React, { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'sb-spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const HANDLE_SIZE = 52
const TRACK_PADDING = 4
const THRESHOLD = 0.9

function triggerDispatchFeedback() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([15, 40, 25])
    }
  } catch (_) {
    // ignore vibration errors
  }

  try {
    const AudioCtx = typeof window !== 'undefined'
      ? (window.AudioContext || window.webkitAudioContext)
      : null
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    gain.connect(ctx.destination)

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(660, now)
    osc1.frequency.exponentialRampToValueAtTime(990, now + 0.18)
    osc1.connect(gain)
    osc1.start(now)
    osc1.stop(now + 0.24)

    osc1.onended = () => {
      try { ctx.close() } catch (_) { /* noop */ }
    }
  } catch (_) {
    // ignore audio errors
  }
}

export default function SlideButton({ onConfirm, disabled = false, status = 'idle', label = 'Slide to dispatch' }) {
  const trackRef = useRef(null)
  const x = useMotionValue(0)
  const [dragging, setDragging] = useState(false)
  const triggeredRef = useRef(false)
  const prevStatusRef = useRef(status)

  const maxX = useCallback(() => {
    if (!trackRef.current) return 200
    return trackRef.current.offsetWidth - HANDLE_SIZE - TRACK_PADDING * 2
  }, [])

  const progress = useTransform(x, (v) => {
    const max = maxX()
    return max > 0 ? Math.min(v / max, 1) : 0
  })

  const labelOpacity = useTransform(progress, [0, 0.35], [1, 0])
  const fillWidth = useTransform(x, (v) => Math.max(0, v + HANDLE_SIZE + TRACK_PADDING))

  const snapBack = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    setDragging(false)
  }, [x])

  useEffect(() => {
    const prev = prevStatusRef.current
    if (status === 'idle') {
      if (prev !== 'idle') {
        triggeredRef.current = false
      }
      snapBack()
    }
    prevStatusRef.current = status
  }, [status, snapBack])

  const tryConfirm = useCallback(() => {
    if (disabled || status !== 'idle') return false
    if (triggeredRef.current) return false
    triggeredRef.current = true
    onConfirm?.()
    return true
  }, [disabled, status, onConfirm])

  const handleDragEnd = useCallback(() => {
    setDragging(false)
    const current = x.get()
    const max = maxX()
    if (max > 0 && current / max >= THRESHOLD) {
      if (tryConfirm()) {
        animate(x, max, { type: 'spring', stiffness: 400, damping: 30 })
        triggerDispatchFeedback()
      } else {
        snapBack()
      }
    } else {
      snapBack()
    }
  }, [x, maxX, tryConfirm, snapBack])

  const handleKeyDown = useCallback((e) => {
    if (disabled || status !== 'idle') return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (tryConfirm()) {
        triggerDispatchFeedback()
      }
    }
  }, [disabled, status, tryConfirm])

  const isActive = !disabled && status === 'idle'

  const handleBg = status === 'idle' ? '#ffffff' : 'rgba(10,10,10,0.9)'
  const handleColor = status === 'idle' ? '#0a0a0a' : '#ffffff'

  return (
    <>
      <style>{`
        @keyframes sb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sb-track:focus-visible {
          outline: 2px solid rgba(255,255,255,0.55);
          outline-offset: 2px;
        }
      `}</style>
      <div
        ref={trackRef}
        className="sb-track"
        role="button"
        tabIndex={isActive ? 0 : -1}
        aria-label={label}
        aria-disabled={!isActive}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (tryConfirm()) {
            triggerDispatchFeedback()
          }
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: HANDLE_SIZE + TRACK_PADDING * 2,
          borderRadius: (HANDLE_SIZE + TRACK_PADDING * 2) / 2,
          background: 'var(--bg-field)',
          border: disabled
            ? 'var(--border-field)'
            : '1px solid rgba(255,255,255,0.18)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          cursor: isActive ? 'default' : 'not-allowed',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transition: 'border-color 300ms ease',
        }}
      >
        {/* Fill track */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: fillWidth,
            background: disabled
              ? 'transparent'
              : 'rgba(255,255,255,0.10)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        />

        {/* Label text */}
        <motion.span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontFamily: 'monospace',
            color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
            opacity: labelOpacity,
            pointerEvents: 'none',
            paddingLeft: HANDLE_SIZE + TRACK_PADDING * 2,
          }}
        >
          {status === 'idle' ? label.toUpperCase() : ''}
        </motion.span>

        {/* Status label (loading / success / error) shown centered when not idle */}
        {status !== 'idle' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontFamily: 'monospace',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
          }}>
            {status === 'loading' && 'DISPATCHING...'}
            {status === 'success' && 'DISPATCHED!'}
            {status === 'error' && 'TRY AGAIN'}
          </div>
        )}

        {/* Drag handle */}
        <motion.div
          drag={isActive ? 'x' : false}
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          style={{
            x,
            position: 'absolute',
            left: TRACK_PADDING,
            top: TRACK_PADDING,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            borderRadius: HANDLE_SIZE / 2,
            background: handleBg,
            color: handleColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isActive ? 'grab' : 'not-allowed',
            boxShadow: disabled
              ? 'none'
              : status !== 'idle'
              ? 'none'
              : '0 2px 12px rgba(0,0,0,0.25)',
            zIndex: 2,
            flexShrink: 0,
            transition: 'background 300ms ease, color 300ms ease, box-shadow 300ms ease',
          }}
          onDragStart={() => isActive && setDragging(true)}
          onDragEnd={handleDragEnd}
          whileTap={isActive ? { scale: 0.96 } : {}}
          tabIndex={-1}
        >
          {status === 'idle' && <ArrowIcon />}
          {status === 'loading' && <SpinnerIcon />}
          {status === 'success' && <CheckIcon />}
          {status === 'error' && <ErrorIcon />}
        </motion.div>
      </div>
    </>
  )
}
