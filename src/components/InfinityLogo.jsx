import React from 'react'

/*
  Car-on-infinity-loop brand mark — Uber / Google Maps style.

  A top-down black-car icon drives continuously around a lemniscate
  (figure-8 / infinity) path, mimicking the Uber driver icon on a map.

  Technique:
  - SVG <animateMotion> + <mpath> moves the car group along the path natively
  - rotate="auto" orients the car to face the direction of travel at every point
  - Car points in the +X direction so "auto" aligns it correctly
  - Route drawn as layered strokes (glow → road → bright centre) = Google Maps feel
  - Yellow headlight beams + red tail lights for realism
*/

// Lemniscate path, traversable as a single closed loop, center crossing at (100,40)
const D = [
  'M 100,40',
  'C 100,15 80,3  55,3',
  'C 30,3  10,20  10,40',
  'C 10,60  30,77  55,77',
  'C 80,77 100,65 100,40',
  'C 100,15 120,3  145,3',
  'C 170,3  190,20 190,40',
  'C 190,60 170,77 145,77',
  'C 120,77 100,65 100,40',
].join(' ')

export default function InfinityLogo({ size = 58 }) {
  const W = Math.round(size * 2.5)   // e.g. 145
  const H = size                      // e.g. 58

  return (
    <>
      <style>{`
        @keyframes beamPulse {
          0%,100% { opacity: 0.15; }
          50%      { opacity: 0.35; }
        }
        @keyframes tailPulse {
          0%,100% { opacity: 0.7; }
          50%      { opacity: 1;   }
        }
      `}</style>

      <svg
        width={W}
        height={H}
        viewBox="0 0 200 80"
        fill="none"
        aria-label="Car driving in infinity loop — Everywhere Transfers"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* ── Route path (layered, Google Maps style) ──────────────── */}

        {/* Outer glow halo */}
        <path d={D} stroke="rgba(255,255,255,0.07)" strokeWidth="18" strokeLinecap="round" />
        {/* Road width */}
        <path d={D} stroke="rgba(255,255,255,0.13)" strokeWidth="11" strokeLinecap="round" />
        {/* Road surface */}
        <path d={D} stroke="rgba(20,20,20,0.85)"    strokeWidth="8"  strokeLinecap="round" />
        {/* Kerb / edge lines */}
        <path d={D} stroke="rgba(255,255,255,0.28)" strokeWidth="5"  strokeLinecap="round" />
        {/* Inner asphalt */}
        <path d={D} stroke="rgba(18,18,18,0.95)"    strokeWidth="3.5" strokeLinecap="round" />
        {/* Bright centre line */}
        <path d={D} stroke="rgba(255,255,255,0.45)" strokeWidth="1"  strokeLinecap="round" />
        {/* Dashed centre markings */}
        <path d={D}
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeDasharray="6 9"
        />

        {/* ── Car — top-down, pointing RIGHT (+X = forward for auto-rotate) ── */}
        <g>
          {/*
            animateMotion moves this <g> along the path.
            rotate="auto" rotates it so its +X axis tracks the tangent.
          */}
          <animateMotion dur="4.2s" repeatCount="indefinite" rotate="auto">
            <mpath href="#routePath" />
          </animateMotion>

          {/* Ground shadow */}
          <ellipse cx="0" cy="2" rx="12" ry="4.5" fill="rgba(0,0,0,0.45)" />

          {/* ── Headlight beams (in front of car, +X side) ─────── */}
          <ellipse
            cx="18" cy="-3.5" rx="9" ry="3"
            fill="rgba(255,245,160,0.22)"
            style={{ animation: 'beamPulse 1.8s ease-in-out infinite' }}
          />
          <ellipse
            cx="18" cy="3.5" rx="9" ry="3"
            fill="rgba(255,245,160,0.22)"
            style={{ animation: 'beamPulse 1.8s ease-in-out infinite 0.9s' }}
          />

          {/* ── Main car body ────────────────────────────────────── */}
          <rect x="-11" y="-7" width="22" height="14" rx="4.5" fill="white" />

          {/* Windshield — front (right / +X side) */}
          <rect x="2" y="-5" width="6.5" height="10" rx="2" fill="rgba(25,25,40,0.55)" />

          {/* Rear window */}
          <rect x="-7.5" y="-4" width="5" height="8" rx="1.8" fill="rgba(25,25,40,0.42)" />

          {/* Centre body stripe (roof line illusion) */}
          <rect x="-6" y="-1.5" width="8" height="3" rx="1" fill="rgba(220,220,220,0.18)" />

          {/* ── Wheels (dark, 4 corners) ─────────────────────────── */}
          {/* Front-left  */}  <rect x="3"  y="-10"  width="6" height="3" rx="1.2" fill="rgba(40,40,40,0.95)" />
          {/* Front-right */}  <rect x="3"  y="7"    width="6" height="3" rx="1.2" fill="rgba(40,40,40,0.95)" />
          {/* Rear-left   */}  <rect x="-9" y="-10"  width="6" height="3" rx="1.2" fill="rgba(40,40,40,0.95)" />
          {/* Rear-right  */}  <rect x="-9" y="7"    width="6" height="3" rx="1.2" fill="rgba(40,40,40,0.95)" />

          {/* ── Headlights (amber) ───────────────────────────────── */}
          <ellipse cx="12" cy="-3.8" rx="2"   ry="1.4" fill="rgba(255,235,80,0.95)" />
          <ellipse cx="12" cy="3.8"  rx="2"   ry="1.4" fill="rgba(255,235,80,0.95)" />

          {/* ── Tail lights (red) ────────────────────────────────── */}
          <ellipse
            cx="-12" cy="-4" rx="1.8" ry="1.2"
            fill="rgba(255,60,60,0.85)"
            style={{ animation: 'tailPulse 1.4s ease-in-out infinite' }}
          />
          <ellipse
            cx="-12" cy="4" rx="1.8" ry="1.2"
            fill="rgba(255,60,60,0.85)"
            style={{ animation: 'tailPulse 1.4s ease-in-out infinite 0.7s' }}
          />
        </g>

        {/* Hidden path for animateMotion reference */}
        <path id="routePath" d={D} stroke="none" fill="none" />
      </svg>

      {/* Brand text — outside the SVG, always static */}
      <p style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.20em',
        textTransform: 'lowercase',
        color: 'rgba(255,255,255,0.45)',
        marginTop: 8,
        fontFamily: 'inherit',
        userSelect: 'none',
        lineHeight: 1,
      }}>
        everywheretransfers.com
      </p>
    </>
  )
}
