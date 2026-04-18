import React from 'react'

/*
  3-D animated infinity-loop brand mark.

  Architecture:
  - Outer div: handles perspective 3-D sway (rotateX / rotateY)
  - Inner SVG: carries the glow filter pulse + two stroke layers
      1. dim static trail (full path)
      2. bright travelling segment (animated stroke-dashoffset)
      3. tight leading hotspot (faster, narrower segment)
  - Brand text: outside the rotating div — always static, never moves
*/

const INF = [
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

const STYLES = `
@keyframes inf3d {
  0%   { transform: perspective(280px) rotateX(14deg)  rotateY(-28deg); }
  25%  { transform: perspective(280px) rotateX(-7deg)  rotateY(8deg);   }
  50%  { transform: perspective(280px) rotateX(14deg)  rotateY(28deg);  }
  75%  { transform: perspective(280px) rotateX(-7deg)  rotateY(-8deg);  }
  100% { transform: perspective(280px) rotateX(14deg)  rotateY(-28deg); }
}

@keyframes infFlow {
  from { stroke-dashoffset: 1000; }
  to   { stroke-dashoffset: 0;    }
}

@keyframes infGlow {
  0%,100% {
    filter: drop-shadow(0 0 4px rgba(255,255,255,.5))
            drop-shadow(0 0 10px rgba(255,255,255,.2));
  }
  50% {
    filter: drop-shadow(0 0 9px rgba(255,255,255,.95))
            drop-shadow(0 0 20px rgba(255,255,255,.45));
  }
}
`

export default function InfinityLogo({ size = 52 }) {
  const w = Math.round(size * 2.5)
  const h = size

  return (
    <>
      <style>{STYLES}</style>

      {/* 3-D sway wrapper — NO filter here to avoid flattening the 3-D context */}
      <div style={{ animation: 'inf3d 7s ease-in-out infinite', display: 'inline-block' }}>

        {/* Glow pulse is on the SVG itself, separate from the 3-D wrapper */}
        <svg
          width={w}
          height={h}
          viewBox="0 0 200 80"
          fill="none"
          aria-label="Everywhere Transfers"
          style={{ display: 'block', animation: 'infGlow 3.5s ease-in-out infinite' }}
        >
          {/* Soft outer halo layers for depth illusion */}
          <path d={INF} stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round" />
          <path d={INF} stroke="rgba(255,255,255,0.13)" strokeWidth="9"  strokeLinecap="round" />

          {/* Static base trail */}
          <path
            d={INF}
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Travelling bright segment */}
          <path
            d={INF}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="1000"
            strokeDasharray="200 800"
            style={{ animation: 'infFlow 2.8s linear infinite' }}
          />

          {/* Tight leading hotspot — sharper, slightly faster */}
          <path
            d={INF}
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="1000"
            strokeDasharray="35 965"
            style={{ animation: 'infFlow 2.8s linear infinite' }}
          />
        </svg>
      </div>

      {/* Brand text — outside the rotating div, always static */}
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
