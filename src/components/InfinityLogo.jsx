import React from 'react'

/*
  Car-on-infinity-road brand mark.

  The lemniscate / ∞ shape:
    Previous path had lobes 74 px tall × 90 px wide (1.2 : 1 ≈ circle → looked like "8").
    New path has lobes 40 px tall × 90 px wide (2.25 : 1 = flat oval → reads as ∞).

    ViewBox 200 × 80.  Path runs x: 10–190 (width 180), y: 20–60 (height 40).
    Center crossing at (100, 40).

  Road cross-section (concentric strokes on same path):
    ① wide faint glow  — ambient street-light haze
    ② white edge band  — road border (outer marking)
    ③ dark asphalt     — road surface (narrower than ②, leaving visible edge lines)
    ④ dashed yellow    — centre lane marking

  Car points in +X so animateMotion rotate="auto" aligns the nose to travel direction.
*/

// ─── Lemniscate path ────────────────────────────────────────────────────────
// Each lobe: 90 px wide × 40 px tall  →  2.25 : 1 flat oval  →  reads as ∞
const D = [
  'M 100,40',
  // ── Left lobe ──────────────────────────────────────────────────────────────
  'C 100,27  80,20   52,20',   // exit center upward-left → top of left lobe
  'C 22,20   10,28   10,40',   // sweep left to the leftmost tip
  'C 10,52   22,60   52,60',   // sweep down to the bottom of the left lobe
  'C 80,60   100,53  100,40',  // return to center from the lower-left
  // ── Right lobe ─────────────────────────────────────────────────────────────
  'C 100,27  120,20  148,20',  // exit center upward-right → top of right lobe
  'C 178,20  190,28  190,40',  // sweep right to the rightmost tip
  'C 190,52  178,60  148,60',  // sweep down to the bottom of the right lobe
  'C 120,60  100,53  100,40',  // return to center from the lower-right
].join(' ')

const CSS = `
@keyframes beamPulse {
  0%,100% { opacity: 0.18; }
  50%      { opacity: 0.45; }
}
@keyframes tailPulse {
  0%,100% { opacity: 0.65; }
  50%      { opacity: 1;    }
}
`

export default function InfinityLogo({ size = 80 }) {
  // Aspect ratio 2.5 : 1 (wide) to match the ∞ shape
  const W = Math.round(size * 2.5)
  const H = size

  return (
    <>
      <style>{CSS}</style>

      <svg
        width={W}
        height={H}
        viewBox="0 0 200 80"
        fill="none"
        aria-label="Car driving on infinity road — Everywhere Transfers"
        style={{ display: 'block', overflow: 'visible' }}
      >

        {/* ══════════════════════════════════════════════════════
            ROAD — 4 concentric strokes, thinner than before to
            suit the flatter ∞ shape (each lobe is only 40 px tall)
            ══════════════════════════════════════════════════════ */}

        {/* ① Ambient glow */}
        <path d={D} stroke="rgba(255,255,255,0.07)" strokeWidth="28" strokeLinecap="round" />

        {/* ② White edge band — road border visible as white stripes */}
        <path d={D} stroke="rgba(255,255,255,0.40)" strokeWidth="18" strokeLinecap="round" />

        {/* ③ Asphalt — 2 units narrower each side = 2 px white edge lines on screen */}
        <path d={D} stroke="#1c1c1c" strokeWidth="14" strokeLinecap="round" />

        {/* Surface texture (barely visible) */}
        <path d={D} stroke="rgba(255,255,255,0.025)" strokeWidth="12" strokeLinecap="round" />

        {/* ④ Yellow dashed centre marking */}
        <path d={D}
          stroke="rgba(255,215,50,0.75)"
          strokeWidth="1.2"
          strokeLinecap="butt"
          strokeDasharray="6 8"
        />

        {/* ══════════════════════════════════════════════════════
            CAR — top-down, nose in +X direction
            Scaled down to fit the narrower road (14 units wide)
            ══════════════════════════════════════════════════════ */}
        <g>
          <animateMotion dur="4.6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#infinityRef" />
          </animateMotion>

          {/* Ground shadow */}
          <ellipse cx="1" cy="0" rx="12" ry="4.5" fill="rgba(0,0,0,0.50)" />

          {/* Headlight beam cones */}
          <ellipse cx="19" cy="-3.2" rx="9" ry="2.8"
            fill="rgba(255,248,180,0.22)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite' }}
          />
          <ellipse cx="19" cy="3.2" rx="9" ry="2.8"
            fill="rgba(255,248,180,0.22)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite 1s' }}
          />

          {/* Car body */}
          <rect x="-10" y="-5.5" width="20" height="11" rx="4" fill="white" />

          {/* Front windshield */}
          <rect x="2"  y="-4"  width="5.5" height="8" rx="2" fill="rgba(20,20,35,0.55)" />

          {/* Rear window */}
          <rect x="-7" y="-3.5" width="4.5" height="7" rx="1.8" fill="rgba(20,20,35,0.42)" />

          {/* Wheels — 4 corners */}
          <rect x="2.5"  y="-8.5" width="5.5" height="3" rx="1.2" fill="rgba(35,35,35,0.95)" />
          <rect x="2.5"  y="5.5"  width="5.5" height="3" rx="1.2" fill="rgba(35,35,35,0.95)" />
          <rect x="-8"   y="-8.5" width="5.5" height="3" rx="1.2" fill="rgba(35,35,35,0.95)" />
          <rect x="-8"   y="5.5"  width="5.5" height="3" rx="1.2" fill="rgba(35,35,35,0.95)" />

          {/* Headlights (amber) */}
          <ellipse cx="11" cy="-3.5" rx="1.8" ry="1.2" fill="rgba(255,235,80,0.97)" />
          <ellipse cx="11" cy="3.5"  rx="1.8" ry="1.2" fill="rgba(255,235,80,0.97)" />

          {/* Tail lights (red, pulsing) */}
          <ellipse cx="-11" cy="-3.5" rx="1.6" ry="1.1"
            fill="rgba(255,55,55,0.88)"
            style={{ animation: 'tailPulse 1.6s ease-in-out infinite' }}
          />
          <ellipse cx="-11" cy="3.5" rx="1.6" ry="1.1"
            fill="rgba(255,55,55,0.88)"
            style={{ animation: 'tailPulse 1.6s ease-in-out infinite 0.8s' }}
          />
        </g>

        {/* Reference path for animateMotion (invisible) */}
        <path id="infinityRef" d={D} stroke="none" fill="none" />
      </svg>

      {/* Brand text — always static */}
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
    </>
  )
}
