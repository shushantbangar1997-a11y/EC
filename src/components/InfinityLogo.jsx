import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

/*
  Car-on-infinity-road brand mark.

  HIDDEN FEATURE: tap the logo to open a vehicle picker showing the 6 fleet
  types actually offered.  Selection saved to localStorage (key: et_car).

  Car coordinate system: centered at (0,0), nose pointing right (+X).
  Road is 14 units wide so cars should stay within y: -5.5 → 5.5.
*/

// ─── Lemniscate path (∞) ────────────────────────────────────────────────────
const D = [
  'M 100,40',
  'C 100,27  80,20   52,20',
  'C 22,20   10,28   10,40',
  'C 10,52   22,60   52,60',
  'C 80,60   100,53  100,40',
  'C 100,27  120,20  148,20',
  'C 178,20  190,28  190,40',
  'C 190,52  178,60  148,60',
  'C 120,60  100,53  100,40',
].join(' ')

// ─── Shared colours ──────────────────────────────────────────────────────────
const TY = '#1e1e1e'                  // tyre
const GL = 'rgba(20,25,45,0.62)'      // dark glass
const HL = 'rgba(255,235,80,0.95)'    // headlight amber
const TL = 'rgba(255,50,50,0.92)'     // tail light red

// ─── Fleet vehicle definitions ───────────────────────────────────────────────
// render(bodyColour) → SVG elements, centered at (0,0), nose →  +X
const CARS = [

  // ── 0  Executive Sedan ────────────────────────────────────────────────────
  // 3-box silhouette: distinct hood / glass cabin / trunk
  {
    label: 'Executive\nSedan',
    render: c => (
      <g>
        {/* Body */}
        <rect x="-11" y="-4.8" width="22" height="9.6" rx="3" fill={c} />
        {/* Glass cabin spanning mid-section */}
        <rect x="-5"  y="-4.2" width="11" height="8.4" rx="1.8" fill={GL} />
        {/* Front pillar / windshield divider */}
        <rect x="3.5" y="-4.2" width="2.5" height="8.4" rx="1.2" fill="rgba(20,25,45,0.70)" />
        {/* Rear pillar */}
        <rect x="-7.5" y="-3.5" width="2.5" height="7" rx="1.2" fill="rgba(20,25,45,0.42)" />
        {/* Side mirrors */}
        <rect x="1"  y="-7"   width="3.5" height="2.2" rx="0.8" fill={c} />
        <rect x="1"  y="4.8"  width="3.5" height="2.2" rx="0.8" fill={c} />
        {/* Wheels — 4 corners */}
        <rect x="3.5" y="-7.8" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="3.5" y="4.8"  width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-9"  y="-7.8" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-9"  y="4.8"  width="5.5" height="3"   rx="1.2" fill={TY} />
        {/* Headlights */}
        <rect x="9.5"  y="-3.8" width="2.2" height="2"  rx="0.5" fill={HL} />
        <rect x="9.5"  y="1.8"  width="2.2" height="2"  rx="0.5" fill={HL} />
        {/* Tail lights */}
        <rect x="-11.7" y="-3.8" width="2.2" height="2" rx="0.5" fill={TL} />
        <rect x="-11.7" y="1.8"  width="2.2" height="2" rx="0.5" fill={TL} />
      </g>
    ),
  },

  // ── 1  Premium SUV ────────────────────────────────────────────────────────
  // Wider & boxier: tall glass area, chunky wheel arches
  {
    label: 'Premium\nSUV',
    render: c => (
      <g>
        {/* Body — wider, shorter than sedan */}
        <rect x="-10" y="-5.5" width="20" height="11" rx="2.5" fill={c} />
        {/* Full-width glass area */}
        <rect x="-6.5" y="-5"  width="13.5" height="10" rx="1.8" fill={GL} />
        {/* B-pillar */}
        <rect x="3.5"  y="-5"  width="3"    height="10" rx="1.2" fill="rgba(20,25,45,0.70)" />
        {/* A-pillar / rear glass */}
        <rect x="-6.5" y="-5"  width="3"    height="10" rx="1.2" fill="rgba(20,25,45,0.42)" />
        {/* Chunky front arches */}
        <rect x="3.5"  y="-9"  width="6"    height="3.5" rx="1.5" fill={TY} />
        <rect x="3.5"  y="5.5" width="6"    height="3.5" rx="1.5" fill={TY} />
        {/* Chunky rear arches */}
        <rect x="-9.5" y="-9"  width="6"    height="3.5" rx="1.5" fill={TY} />
        <rect x="-9.5" y="5.5" width="6"    height="3.5" rx="1.5" fill={TY} />
        {/* Headlights */}
        <rect x="9.5"  y="-4.5" width="2.5" height="2.5" rx="0.5" fill={HL} />
        <rect x="9.5"  y="2"    width="2.5" height="2.5" rx="0.5" fill={HL} />
        {/* Tail lights */}
        <rect x="-12"  y="-4.5" width="2.5" height="2.5" rx="0.5" fill={TL} />
        <rect x="-12"  y="2"    width="2.5" height="2.5" rx="0.5" fill={TL} />
      </g>
    ),
  },

  // ── 2  Mercedes Sprinter ─────────────────────────────────────────────────
  // Long, tall-roofed van: long body, narrow side windows, sliding-door line
  {
    label: 'Mercedes\nSprinter',
    render: c => (
      <g>
        {/* Body — long rectangle, boxy */}
        <rect x="-12" y="-5.2" width="24" height="10.4" rx="2" fill={c} />
        {/* Cab glass (front third) */}
        <rect x="3.5"  y="-4.6" width="8.5" height="9.2" rx="1.5" fill={GL} />
        {/* Cargo/passenger side windows (rear) */}
        <rect x="-5.5" y="-4.2" width="3.5" height="3.5" rx="0.8" fill={GL} />
        <rect x="-5.5" y="0.7"  width="3.5" height="3.5" rx="0.8" fill={GL} />
        <rect x="-1.5" y="-4.2" width="3.5" height="3.5" rx="0.8" fill={GL} />
        <rect x="-1.5" y="0.7"  width="3.5" height="3.5" rx="0.8" fill={GL} />
        {/* Sliding door line */}
        <line x1="2" y1="-5.2" x2="2" y2="5.2" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        {/* Wheels */}
        <rect x="4.5"  y="-9"   width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="4.5"  y="5.5"  width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="-10.5" y="-9"  width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="-10.5" y="5.5" width="6"   height="3.5" rx="1.2" fill={TY} />
        {/* Headlights */}
        <rect x="11"   y="-4.2" width="2"   height="2.5" rx="0.4" fill={HL} />
        <rect x="11"   y="1.7"  width="2"   height="2.5" rx="0.4" fill={HL} />
        {/* Tail lights */}
        <rect x="-13"  y="-4.2" width="2"   height="2.5" rx="0.4" fill={TL} />
        <rect x="-13"  y="1.7"  width="2"   height="2.5" rx="0.4" fill={TL} />
      </g>
    ),
  },

  // ── 3  Stretch Limousine ──────────────────────────────────────────────────
  // Very long, narrow body; many window sections; small wheels
  {
    label: 'Stretch\nLimousine',
    render: c => (
      <g>
        {/* Body — very long, sedan-width */}
        <rect x="-14" y="-4.5" width="28" height="9" rx="2.8" fill={c} />
        {/* Passenger glass — long unbroken section */}
        <rect x="-9"  y="-3.8" width="17" height="7.6" rx="1.5" fill={GL} />
        {/* Front pillar */}
        <rect x="5.5"  y="-3.8" width="2.5" height="7.6" rx="1.2" fill="rgba(20,25,45,0.70)" />
        {/* Rear pillar */}
        <rect x="-9.5" y="-3.8" width="2.5" height="7.6" rx="1.2" fill="rgba(20,25,45,0.42)" />
        {/* Window division bars */}
        <rect x="-2"   y="-3.8" width="0.8" height="7.6" fill="rgba(0,0,0,0.25)" />
        <rect x="2.5"  y="-3.8" width="0.8" height="7.6" fill="rgba(0,0,0,0.20)" />
        {/* Wheels — 4 corners */}
        <rect x="6.5"  y="-7.5" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="6.5"  y="4.5"  width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-12"  y="-7.5" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-12"  y="4.5"  width="5.5" height="3"   rx="1.2" fill={TY} />
        {/* Headlights */}
        <rect x="13.5" y="-3.2" width="1.5" height="1.8" rx="0.4" fill={HL} />
        <rect x="13.5" y="1.4"  width="1.5" height="1.8" rx="0.4" fill={HL} />
        {/* Tail lights */}
        <rect x="-15"  y="-3.2" width="1.5" height="1.8" rx="0.4" fill={TL} />
        <rect x="-15"  y="1.4"  width="1.5" height="1.8" rx="0.4" fill={TL} />
      </g>
    ),
  },

  // ── 4  Mini Bus / Shuttle ─────────────────────────────────────────────────
  // Wider than Sprinter, multiple evenly-spaced side windows, flat front
  {
    label: 'Mini Bus\n/ Shuttle',
    render: c => (
      <g>
        {/* Body — wide, medium-long */}
        <rect x="-12" y="-6" width="24" height="12" rx="2" fill={c} />
        {/* Side window strip */}
        <rect x="-9"  y="-5.2" width="17" height="4.5" rx="1" fill={GL} />
        <rect x="-9"  y="0.7"  width="17" height="4.5" rx="1" fill={GL} />
        {/* Window dividers */}
        {[-5, -1, 3, 7].map(x => (
          <rect key={x} x={x} y="-5.2" width="0.7" height="10.4" fill="rgba(0,0,0,0.20)" />
        ))}
        {/* Door line */}
        <line x1="1" y1="-6" x2="1" y2="6" stroke="rgba(0,0,0,0.28)" strokeWidth="0.7" />
        {/* Wheels */}
        <rect x="4.5"  y="-9.5" width="6"   height="3.5" rx="1.5" fill={TY} />
        <rect x="4.5"  y="6"    width="6"   height="3.5" rx="1.5" fill={TY} />
        <rect x="-10.5" y="-9.5" width="6"  height="3.5" rx="1.5" fill={TY} />
        <rect x="-10.5" y="6"   width="6"   height="3.5" rx="1.5" fill={TY} />
        {/* Headlights — full-width strip */}
        <rect x="10.5" y="-5.5" width="2"   height="11"  rx="0.5" fill="rgba(255,245,180,0.40)" />
        <rect x="11"   y="-4.5" width="1.5" height="3"   rx="0.3" fill={HL} />
        <rect x="11"   y="1.5"  width="1.5" height="3"   rx="0.3" fill={HL} />
        {/* Tail lights */}
        <rect x="-13"  y="-4.5" width="1.5" height="3"   rx="0.3" fill={TL} />
        <rect x="-13"  y="1.5"  width="1.5" height="3"   rx="0.3" fill={TL} />
      </g>
    ),
  },

  // ── 5  Luxury Coach ───────────────────────────────────────────────────────
  // Full-size coach bus: very wide, very long, panoramic windows, dual axles
  {
    label: 'Luxury\nCoach',
    render: c => (
      <g>
        {/* Body */}
        <rect x="-14" y="-6.5" width="28" height="13" rx="2" fill={c} />
        {/* Panoramic side windows — top + bottom strips */}
        <rect x="-11" y="-6"   width="22" height="4.8" rx="1" fill={GL} />
        <rect x="-11" y="1.2"  width="22" height="4.8" rx="1" fill={GL} />
        {/* Window pillars */}
        {[-7, -3, 1, 5, 9].map(x => (
          <rect key={x} x={x} y="-6" width="0.8" height="12" fill="rgba(0,0,0,0.18)" />
        ))}
        {/* Door */}
        <line x1="3" y1="-6.5" x2="3" y2="6.5" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
        {/* Dual rear axle wheels */}
        <rect x="5"   y="-10.5" width="6.5" height="4"  rx="1.5" fill={TY} />
        <rect x="5"   y="6.5"   width="6.5" height="4"  rx="1.5" fill={TY} />
        <rect x="-1.5" y="-10.5" width="6.5" height="4" rx="1.5" fill={TY} />
        <rect x="-1.5" y="6.5"  width="6.5" height="4"  rx="1.5" fill={TY} />
        {/* Front axle */}
        <rect x="-11.5" y="-10.5" width="6.5" height="4" rx="1.5" fill={TY} />
        <rect x="-11.5" y="6.5"   width="6.5" height="4" rx="1.5" fill={TY} />
        {/* Headlights — wide bar */}
        <rect x="13"  y="-6"   width="2"   height="13"  rx="0.5" fill="rgba(255,245,180,0.30)" />
        <rect x="13.5" y="-5"  width="1.5" height="3.5" rx="0.3" fill={HL} />
        <rect x="13.5" y="1.5" width="1.5" height="3.5" rx="0.3" fill={HL} />
        {/* Tail lights */}
        <rect x="-15"  y="-5"  width="1.5" height="3.5" rx="0.3" fill={TL} />
        <rect x="-15"  y="1.5" width="1.5" height="3.5" rx="0.3" fill={TL} />
      </g>
    ),
  },
]

// ─── CSS animations ──────────────────────────────────────────────────────────
const CSS = `
@keyframes beamPulse {
  0%,100% { opacity: 0.16; }
  50%      { opacity: 0.42; }
}
@keyframes tailPulse {
  0%,100% { opacity: 0.65; }
  50%      { opacity: 1;    }
}
@keyframes pickerIn {
  from { opacity: 0; transform: translateX(-50%) translateY(calc(-100% + 6px)) scale(0.96); }
  to   { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
}
`

// ─── Component ───────────────────────────────────────────────────────────────
export default function InfinityLogo({ size = 80 }) {
  const [carIdx, setCarIdx] = useState(() => {
    try { return Math.min(parseInt(localStorage.getItem('et_car') || '0', 10), CARS.length - 1) }
    catch { return 0 }
  })
  const [open, setOpen]           = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
  const wrapRef   = useRef(null)
  const pickerRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem('et_car', carIdx) } catch {}
  }, [carIdx])

  const openPicker = useCallback(() => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect()
      setPickerPos({ top: r.top - 10, left: r.left + r.width / 2 })
    }
    setOpen(o => !o)
  }, [])

  useEffect(() => {
    if (!open) return
    const close = e => {
      if (
        wrapRef.current  && !wrapRef.current.contains(e.target) &&
        pickerRef.current && !pickerRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const svgW   = Math.round(size * 2.5)
  const svgH   = size
  // Clamp in case localStorage held an index from the previous 34-car list
  const safeIdx = Math.min(Math.max(0, carIdx), CARS.length - 1)
  const car     = CARS[safeIdx]

  // Scale factor so each car fits within the 14-unit road width.
  // Limo and Coach are larger so need a slightly smaller scale.
  const SCALE = (safeIdx === 3 || safeIdx === 5) ? 0.68 : (safeIdx === 4) ? 0.72 : 0.80

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <style>{CSS}</style>

      {/* ── Logo SVG ─────────────────────────────────────────────────────── */}
      <svg
        width={svgW}
        height={svgH}
        viewBox="0 0 200 80"
        fill="none"
        aria-label="Everywhere Transfers — vehicle on infinity road"
        style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}
        onClick={openPicker}
      >
        {/* Road */}
        <path d={D} stroke="rgba(255,255,255,0.07)" strokeWidth="28" strokeLinecap="round" />
        <path d={D} stroke="rgba(255,255,255,0.40)" strokeWidth="18" strokeLinecap="round" />
        <path d={D} stroke="#1c1c1c"                strokeWidth="14" strokeLinecap="round" />
        <path d={D} stroke="rgba(255,255,255,0.025)" strokeWidth="12" strokeLinecap="round" />
        <path d={D} stroke="rgba(255,215,50,0.75)"  strokeWidth="1.2" strokeLinecap="butt" strokeDasharray="6 8" />

        {/* Animated vehicle */}
        <g>
          <animateMotion dur="4.6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#infinityRef" />
          </animateMotion>

          {/* Ground shadow */}
          <ellipse cx="0" cy="0" rx="13" ry="5.5" fill="rgba(0,0,0,0.40)" />

          {/* Headlight beams */}
          <ellipse cx="20" cy="-3" rx="9" ry="2.5"
            fill="rgba(255,248,180,0.18)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite' }}
          />
          <ellipse cx="20" cy="3" rx="9" ry="2.5"
            fill="rgba(255,248,180,0.18)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite 1s' }}
          />

          {/* Vehicle, scaled to road */}
          <g transform={`scale(${SCALE})`}>
            {car.render('white')}
          </g>
        </g>

        <path id="infinityRef" d={D} stroke="none" fill="none" />
      </svg>

      {/* ── Fleet picker (portal → escapes overflow:hidden) ──────────────── */}
      {open && createPortal(
        <div
          ref={pickerRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top:  pickerPos.top,
            left: pickerPos.left,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'rgba(6,6,6,0.90)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 16,
            padding: '12px 10px 10px',
            display: 'flex',
            flexDirection: 'row',
            gap: 6,
            zIndex: 99999,
            border: '1px solid rgba(255,255,255,0.11)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.75)',
            animation: 'pickerIn 0.18s ease-out forwards',
          }}
        >
          {CARS.map((c, i) => {
            const active = safeIdx === i
            // Scale each preview: limo/coach need more shrinking
            const ps = (i === 3 || i === 5) ? 0.58 : (i === 4) ? 0.62 : 0.72
            return (
              <button
                key={i}
                title={c.label.replace('\n', ' ')}
                onClick={() => { setCarIdx(i); setOpen(false) }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '8px 6px 6px',
                  background: active ? 'rgba(255,255,255,0.13)' : 'transparent',
                  border: active
                    ? '1px solid rgba(255,255,255,0.35)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  width: 74,
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Vehicle preview */}
                <svg width="64" height="32" viewBox="-16 -10 32 20" fill="none">
                  <g transform={`scale(${ps})`}>
                    {c.render('rgba(255,255,255,0.90)')}
                  </g>
                </svg>
                {/* Label */}
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.50)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  whiteSpace: 'pre',
                  fontFamily: 'inherit',
                }}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>,
        document.body
      )}

      {/* Brand text */}
      <p style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.20em',
        textTransform: 'lowercase',
        color: 'rgba(255,255,255,0.42)',
        marginTop: 10,
        fontFamily: 'inherit',
        userSelect: 'none',
        lineHeight: 1,
      }}>
        everywheretransfers.com
      </p>
    </div>
  )
}
