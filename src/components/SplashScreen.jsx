import React, { useEffect, useRef, useState } from 'react'
import { D, CARS, carScale, savedCarIdx } from './fleetCars'

/*
  Full-screen welcome animation.
  • Infinity road fills the screen.
  • Selected fleet vehicle drives around the ∞ loop.
  • Brand name fades in after the first full loop.
  • Auto-dismisses after ~7 s; click/tap anywhere to skip.
*/

// ─── timing constants (ms) ────────────────────────────────────────────────
const LOOP_DURATION  = 5000   // one lap of the ∞
const TEXT_DELAY     = 3600   // when brand text fades in
const FADE_START     = 6200   // when everything starts fading out
const DONE_DELAY     = 6900   // when onDone is called

// ─── inline CSS injected once ────────────────────────────────────────────
const SPLASH_CSS = `
@keyframes sp-roadIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sp-beam {
  0%,100% { opacity: 0.15; }
  50%      { opacity: 0.55; }
}
@keyframes sp-tail {
  0%,100% { opacity: 0.60; }
  50%      { opacity: 1;    }
}
@keyframes sp-textIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes sp-dash {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -28; }
}
@keyframes sp-pulse {
  0%,100% { opacity: 0.06; }
  50%      { opacity: 0.13; }
}
`

function SplashScreen({ onDone }) {
  const [phase, setPhase]     = useState('in')    // 'in' | 'show' | 'out'
  const [showText, setShowText] = useState(false)
  const dismissed             = useRef(false)

  const dismiss = () => {
    if (dismissed.current) return
    dismissed.current = true
    setPhase('out')
    setTimeout(onDone, 700)
  }

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'),  50)
    const t2 = setTimeout(() => setShowText(true), TEXT_DELAY)
    const t3 = setTimeout(() => setPhase('out'),   FADE_START)
    const t4 = setTimeout(onDone,                   DONE_DELAY)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  const idx    = savedCarIdx()
  const car    = CARS[idx]
  const sc     = carScale(idx)

  // Larger headlight beams for the full-screen version
  const beamW = idx === 4 || idx === 5 ? 18 : 22  // buses get wider beams

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(20px, 4vh, 48px)',
        opacity: phase === 'out' ? 0 : phase === 'show' ? 1 : 0,
        transition: phase === 'out' ? 'opacity 0.7s ease' : 'opacity 0.9s ease',
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      <style>{SPLASH_CSS}</style>

      {/* ── Ambient radial background glow ─────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
        animation: 'sp-pulse 4s ease-in-out infinite',
      }} />

      {/* ── Vignette corners ────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 50%, rgba(0,0,0,0.70) 100%)',
      }} />

      {/* ── Infinity road SVG ───────────────────────────────────────────── */}
      <div style={{
        width: 'min(90vw, calc(52vh * 2.5))',
        aspectRatio: '200 / 80',
        position: 'relative',
        flexShrink: 0,
        animation: 'sp-roadIn 0.9s ease forwards',
      }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 80"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            {/* Animated dash movement for center line */}
            <style>{`
              .sp-dashes { animation: sp-dash 0.35s linear infinite; }
            `}</style>
          </defs>

          {/* ── Road layers (outside → in) ──────────────────────────────── */}

          {/* Outermost haze — street-light atmosphere */}
          <path d={D} stroke="rgba(255,255,255,0.025)" strokeWidth="90" strokeLinecap="round" />

          {/* Wide soft glow */}
          <path d={D} stroke="rgba(255,255,255,0.05)"  strokeWidth="58" strokeLinecap="round" />

          {/* Medium glow — visible corona */}
          <path d={D} stroke="rgba(255,255,255,0.09)"  strokeWidth="36" strokeLinecap="round" />

          {/* White edge markings */}
          <path d={D} stroke="rgba(255,255,255,0.52)"  strokeWidth="22" strokeLinecap="round" />

          {/* Asphalt */}
          <path d={D} stroke="#0e0e0e"                  strokeWidth="18" strokeLinecap="round" />

          {/* Surface — barely-visible wet sheen */}
          <path d={D} stroke="rgba(255,255,255,0.018)"  strokeWidth="16" strokeLinecap="round" />

          {/* Animated yellow centre dashes */}
          <path
            className="sp-dashes"
            d={D}
            stroke="rgba(255,215,50,0.88)"
            strokeWidth="1.4"
            strokeLinecap="butt"
            strokeDasharray="7 9"
          />

          {/* ── Animated vehicle ──────────────────────────────────────────── */}
          <g>
            <animateMotion
              dur={`${LOOP_DURATION / 1000}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href="#spRef" />
            </animateMotion>

            {/* Ground shadow */}
            <ellipse cx="0" cy="0" rx="15" ry="6" fill="rgba(0,0,0,0.55)" />

            {/* Headlight beam — left */}
            <ellipse
              cx={beamW} cy="-3.5" rx={beamW * 0.55} ry="3.2"
              fill="rgba(255,248,200,0.22)"
              style={{ animation: 'sp-beam 2s ease-in-out infinite' }}
            />
            {/* Headlight beam — right */}
            <ellipse
              cx={beamW} cy="3.5" rx={beamW * 0.55} ry="3.2"
              fill="rgba(255,248,200,0.22)"
              style={{ animation: 'sp-beam 2s ease-in-out infinite 1s' }}
            />

            {/* Tail-light ground wash */}
            <ellipse cx="-14" cy="0" rx="7" ry="4"
              fill="rgba(255,40,40,0.12)"
              style={{ animation: 'sp-tail 1.6s ease-in-out infinite' }}
            />

            {/* Fleet vehicle */}
            <g transform={`scale(${sc})`}>
              {car.render('white')}
            </g>
          </g>

          {/* Invisible reference path */}
          <path id="spRef" d={D} stroke="none" fill="none" />
        </svg>
      </div>

      {/* ── Brand text (fades in after first loop) ──────────────────────── */}
      <div style={{
        textAlign: 'center',
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <p style={{
          fontSize: 'clamp(10px, 1.2vw, 14px)',
          fontWeight: 700,
          letterSpacing: '0.38em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          margin: '0 0 10px',
          fontFamily: 'inherit',
        }}>
          Everywhere Transfers
        </p>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 62px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: '#ffffff',
          margin: '0 0 12px',
          fontFamily: 'inherit',
        }}>
          Your Ride,{' '}
          <span style={{ color: 'rgba(255,215,50,0.95)' }}>Your Price.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(12px, 1.4vw, 16px)',
          color: 'rgba(255,255,255,0.38)',
          letterSpacing: '0.08em',
          margin: 0,
          fontFamily: 'inherit',
        }}>
          New York City · Airport · Events · Corporate
        </p>
      </div>

      {/* ── Skip hint ───────────────────────────────────────────────────── */}
      <p style={{
        position: 'absolute', bottom: 'clamp(16px, 3vh, 32px)',
        fontSize: 11,
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.18)',
        textTransform: 'uppercase',
        margin: 0,
        fontFamily: 'inherit',
        userSelect: 'none',
        opacity: showText ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        Tap anywhere to skip
      </p>
    </div>
  )
}

// ─── Gate — wraps the whole app ─────────────────────────────────────────────
function SplashScreenGate({ children }) {
  const [done, setDone] = useState(false)
  return (
    <>
      {!done && <SplashScreen onDone={() => setDone(true)} />}
      {children}
    </>
  )
}

export default SplashScreenGate
