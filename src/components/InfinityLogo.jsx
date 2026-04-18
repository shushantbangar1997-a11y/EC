import React from 'react'

/*
  Car-on-infinity-road brand mark.

  Road cross-section (layered SVG strokes on the same path):
    ①  wide faint glow  — ambient street-light haze
    ②  white edge band  — visible road border / white edge lines
    ③  dark asphalt     — road surface, slightly narrower than ② leaving
                          a white stripe on each side (the edge lines)
    ④  dashed centre    — painted centre lane dividers

  Car points in +X direction so animateMotion rotate="auto" aligns nose
  with the travel direction at every point on the lemniscate.
*/

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

const CSS = `
@keyframes beamPulse {
  0%,100% { opacity: 0.18; }
  50%      { opacity: 0.42; }
}
@keyframes tailPulse {
  0%,100% { opacity: 0.65; }
  50%      { opacity: 1;    }
}
`

export default function InfinityLogo({ size = 72 }) {
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
        aria-label="Car driving in infinity road — Everywhere Transfers"
        style={{ display: 'block', overflow: 'visible' }}
      >

        {/* ══════════════════════════════════════════════════════
            ROAD  (4 concentric strokes = realistic cross-section)
            ══════════════════════════════════════════════════════ */}

        {/* ① Ambient glow — street-light haze around road */}
        <path d={D}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="38"
          strokeLinecap="round"
        />

        {/* ② White edge band — outermost road marking */}
        <path d={D}
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="26"
          strokeLinecap="round"
        />

        {/* ③ Asphalt surface — dark, slightly narrower than ②
              The 2.5-unit gap on each side = visible white edge lines */}
        <path d={D}
          stroke="#1c1c1c"
          strokeWidth="21"
          strokeLinecap="round"
        />

        {/* Subtle surface texture: very faint lighter tone on asphalt */}
        <path d={D}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="19"
          strokeLinecap="round"
        />

        {/* ④ Dashed centre lane markings — yellow, classic road style */}
        <path d={D}
          stroke="rgba(255,220,60,0.70)"
          strokeWidth="1.4"
          strokeLinecap="butt"
          strokeDasharray="7 9"
        />

        {/* Thin white inner edge accent (kerb reflex effect) */}
        <path d={D}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="21"
          strokeLinecap="round"
          strokeDasharray="0"
        />

        {/* ══════════════════════════════════════════════════════
            CAR  — top-down, nose pointing in +X direction
            ══════════════════════════════════════════════════════ */}
        <g>
          <animateMotion dur="4.4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#routeRef" />
          </animateMotion>

          {/* Ground shadow (oval beneath car, offset slightly forward) */}
          <ellipse cx="1" cy="0" rx="14" ry="5.5" fill="rgba(0,0,0,0.55)" />

          {/* Wet-asphalt reflection glow */}
          <ellipse cx="0" cy="0" rx="12" ry="4" fill="rgba(255,255,255,0.04)" />

          {/* ── Headlight beam cones (ahead of car) ────────────── */}
          <ellipse cx="22" cy="-4.2" rx="11" ry="3.5"
            fill="rgba(255,248,180,0.20)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite' }}
          />
          <ellipse cx="22" cy="4.2" rx="11" ry="3.5"
            fill="rgba(255,248,180,0.20)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite 1s' }}
          />

          {/* ── Car body ─────────────────────────────────────────── */}
          <rect x="-12" y="-7.5" width="24" height="15" rx="5" fill="white" />

          {/* Front windshield (right / +X side) */}
          <rect x="2.5" y="-5.5" width="7" height="11" rx="2.2"
            fill="rgba(20,20,35,0.55)" />

          {/* Rear window */}
          <rect x="-8.5" y="-4.5" width="5.5" height="9" rx="2"
            fill="rgba(20,20,35,0.42)" />

          {/* Roof / body crease highlight */}
          <rect x="-5" y="-2" width="7" height="4" rx="1.2"
            fill="rgba(230,230,230,0.15)" />

          {/* ── Wheels — 4 corners, dark rubber ─────────────────── */}
          {/* Front-left  */}<rect x="3"   y="-11" width="7" height="3.5" rx="1.5"
            fill="rgba(35,35,35,0.95)" />
          {/* Front-right */}<rect x="3"   y="7.5"  width="7" height="3.5" rx="1.5"
            fill="rgba(35,35,35,0.95)" />
          {/* Rear-left   */}<rect x="-10" y="-11" width="7" height="3.5" rx="1.5"
            fill="rgba(35,35,35,0.95)" />
          {/* Rear-right  */}<rect x="-10" y="7.5"  width="7" height="3.5" rx="1.5"
            fill="rgba(35,35,35,0.95)" />

          {/* ── Headlights (amber) ───────────────────────────────── */}
          <ellipse cx="13" cy="-4.5" rx="2.2" ry="1.5" fill="rgba(255,235,80,0.97)" />
          <ellipse cx="13" cy="4.5"  rx="2.2" ry="1.5" fill="rgba(255,235,80,0.97)" />

          {/* ── Tail lights (red, pulsing) ───────────────────────── */}
          <ellipse cx="-13" cy="-4.5" rx="2" ry="1.4"
            fill="rgba(255,55,55,0.88)"
            style={{ animation: 'tailPulse 1.6s ease-in-out infinite' }}
          />
          <ellipse cx="-13" cy="4.5" rx="2" ry="1.4"
            fill="rgba(255,55,55,0.88)"
            style={{ animation: 'tailPulse 1.6s ease-in-out infinite 0.8s' }}
          />
        </g>

        {/* Reference path for animateMotion (invisible) */}
        <path id="routeRef" d={D} stroke="none" fill="none" />
      </svg>

      {/* Brand text — static, never moves */}
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
