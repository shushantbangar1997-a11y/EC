/*
  Shared fleet-vehicle definitions.
  Used by InfinityLogo.jsx and SplashScreen.jsx.

  Each car: { label, render(bodyColour) → SVG elements }
  Coordinate system: centered (0,0), nose facing right (+X).
*/

// ── Lemniscate path (∞) ────────────────────────────────────────────────────
export const D = [
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

// ── Shared palette ─────────────────────────────────────────────────────────
const TY = '#1e1e1e'
const GL = 'rgba(20,25,45,0.62)'
const HL = 'rgba(255,235,80,0.95)'
const TL = 'rgba(255,50,50,0.92)'

// ── 6 real fleet vehicles ──────────────────────────────────────────────────
export const CARS = [

  // 0 — Executive Sedan
  {
    label: 'Executive\nSedan',
    render: c => (
      <g>
        <rect x="-11" y="-4.8" width="22" height="9.6" rx="3" fill={c} />
        <rect x="-5"  y="-4.2" width="11" height="8.4" rx="1.8" fill={GL} />
        <rect x="3.5" y="-4.2" width="2.5" height="8.4" rx="1.2" fill="rgba(20,25,45,0.70)" />
        <rect x="-7.5" y="-3.5" width="2.5" height="7"  rx="1.2" fill="rgba(20,25,45,0.42)" />
        <rect x="1"   y="-7"   width="3.5" height="2.2" rx="0.8" fill={c} />
        <rect x="1"   y="4.8"  width="3.5" height="2.2" rx="0.8" fill={c} />
        <rect x="3.5" y="-7.8" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="3.5" y="4.8"  width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-9"  y="-7.8" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-9"  y="4.8"  width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="9.5"  y="-3.8" width="2.2" height="2"  rx="0.5" fill={HL} />
        <rect x="9.5"  y="1.8"  width="2.2" height="2"  rx="0.5" fill={HL} />
        <rect x="-11.7" y="-3.8" width="2.2" height="2" rx="0.5" fill={TL} />
        <rect x="-11.7" y="1.8"  width="2.2" height="2" rx="0.5" fill={TL} />
      </g>
    ),
  },

  // 1 — Premium SUV
  {
    label: 'Premium\nSUV',
    render: c => (
      <g>
        <rect x="-10" y="-5.5" width="20" height="11"   rx="2.5" fill={c} />
        <rect x="-6.5" y="-5"  width="13.5" height="10" rx="1.8" fill={GL} />
        <rect x="3.5"  y="-5"  width="3"    height="10" rx="1.2" fill="rgba(20,25,45,0.70)" />
        <rect x="-6.5" y="-5"  width="3"    height="10" rx="1.2" fill="rgba(20,25,45,0.42)" />
        <rect x="3.5"  y="-9"  width="6"    height="3.5" rx="1.5" fill={TY} />
        <rect x="3.5"  y="5.5" width="6"    height="3.5" rx="1.5" fill={TY} />
        <rect x="-9.5" y="-9"  width="6"    height="3.5" rx="1.5" fill={TY} />
        <rect x="-9.5" y="5.5" width="6"    height="3.5" rx="1.5" fill={TY} />
        <rect x="9.5"  y="-4.5" width="2.5" height="2.5" rx="0.5" fill={HL} />
        <rect x="9.5"  y="2"    width="2.5" height="2.5" rx="0.5" fill={HL} />
        <rect x="-12"  y="-4.5" width="2.5" height="2.5" rx="0.5" fill={TL} />
        <rect x="-12"  y="2"    width="2.5" height="2.5" rx="0.5" fill={TL} />
      </g>
    ),
  },

  // 2 — Mercedes Sprinter
  {
    label: 'Mercedes\nSprinter',
    render: c => (
      <g>
        <rect x="-12" y="-5.2" width="24" height="10.4" rx="2" fill={c} />
        <rect x="3.5"  y="-4.6" width="8.5" height="9.2" rx="1.5" fill={GL} />
        <rect x="-5.5" y="-4.2" width="3.5" height="3.5" rx="0.8" fill={GL} />
        <rect x="-5.5" y="0.7"  width="3.5" height="3.5" rx="0.8" fill={GL} />
        <rect x="-1.5" y="-4.2" width="3.5" height="3.5" rx="0.8" fill={GL} />
        <rect x="-1.5" y="0.7"  width="3.5" height="3.5" rx="0.8" fill={GL} />
        <line x1="2" y1="-5.2" x2="2" y2="5.2" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        <rect x="4.5"  y="-9"   width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="4.5"  y="5.5"  width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="-10.5" y="-9"  width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="-10.5" y="5.5" width="6"   height="3.5" rx="1.2" fill={TY} />
        <rect x="11"   y="-4.2" width="2"   height="2.5" rx="0.4" fill={HL} />
        <rect x="11"   y="1.7"  width="2"   height="2.5" rx="0.4" fill={HL} />
        <rect x="-13"  y="-4.2" width="2"   height="2.5" rx="0.4" fill={TL} />
        <rect x="-13"  y="1.7"  width="2"   height="2.5" rx="0.4" fill={TL} />
      </g>
    ),
  },

  // 3 — Stretch Limousine
  {
    label: 'Stretch\nLimousine',
    render: c => (
      <g>
        <rect x="-14" y="-4.5" width="28" height="9"   rx="2.8" fill={c} />
        <rect x="-9"  y="-3.8" width="17" height="7.6" rx="1.5" fill={GL} />
        <rect x="5.5"  y="-3.8" width="2.5" height="7.6" rx="1.2" fill="rgba(20,25,45,0.70)" />
        <rect x="-9.5" y="-3.8" width="2.5" height="7.6" rx="1.2" fill="rgba(20,25,45,0.42)" />
        <rect x="-2"   y="-3.8" width="0.8" height="7.6" fill="rgba(0,0,0,0.25)" />
        <rect x="2.5"  y="-3.8" width="0.8" height="7.6" fill="rgba(0,0,0,0.20)" />
        <rect x="6.5"  y="-7.5" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="6.5"  y="4.5"  width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-12"  y="-7.5" width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="-12"  y="4.5"  width="5.5" height="3"   rx="1.2" fill={TY} />
        <rect x="13.5" y="-3.2" width="1.5" height="1.8" rx="0.4" fill={HL} />
        <rect x="13.5" y="1.4"  width="1.5" height="1.8" rx="0.4" fill={HL} />
        <rect x="-15"  y="-3.2" width="1.5" height="1.8" rx="0.4" fill={TL} />
        <rect x="-15"  y="1.4"  width="1.5" height="1.8" rx="0.4" fill={TL} />
      </g>
    ),
  },

  // 4 — Mini Bus / Shuttle
  {
    label: 'Mini Bus\n/ Shuttle',
    render: c => (
      <g>
        <rect x="-12" y="-6" width="24" height="12" rx="2" fill={c} />
        <rect x="-9"  y="-5.2" width="17" height="4.5" rx="1" fill={GL} />
        <rect x="-9"  y="0.7"  width="17" height="4.5" rx="1" fill={GL} />
        {[-5, -1, 3, 7].map(x => (
          <rect key={x} x={x} y="-5.2" width="0.7" height="10.4" fill="rgba(0,0,0,0.20)" />
        ))}
        <line x1="1" y1="-6" x2="1" y2="6" stroke="rgba(0,0,0,0.28)" strokeWidth="0.7" />
        <rect x="4.5"  y="-9.5" width="6"  height="3.5" rx="1.5" fill={TY} />
        <rect x="4.5"  y="6"    width="6"  height="3.5" rx="1.5" fill={TY} />
        <rect x="-10.5" y="-9.5" width="6" height="3.5" rx="1.5" fill={TY} />
        <rect x="-10.5" y="6"   width="6"  height="3.5" rx="1.5" fill={TY} />
        <rect x="10.5" y="-5.5" width="2"   height="11" rx="0.5" fill="rgba(255,245,180,0.40)" />
        <rect x="11"   y="-4.5" width="1.5" height="3"  rx="0.3" fill={HL} />
        <rect x="11"   y="1.5"  width="1.5" height="3"  rx="0.3" fill={HL} />
        <rect x="-13"  y="-4.5" width="1.5" height="3"  rx="0.3" fill={TL} />
        <rect x="-13"  y="1.5"  width="1.5" height="3"  rx="0.3" fill={TL} />
      </g>
    ),
  },

  // 5 — Luxury Coach
  {
    label: 'Luxury\nCoach',
    render: c => (
      <g>
        <rect x="-14" y="-6.5" width="28" height="13"  rx="2"   fill={c} />
        <rect x="-11" y="-6"   width="22" height="4.8" rx="1"   fill={GL} />
        <rect x="-11" y="1.2"  width="22" height="4.8" rx="1"   fill={GL} />
        {[-7, -3, 1, 5, 9].map(x => (
          <rect key={x} x={x} y="-6" width="0.8" height="12" fill="rgba(0,0,0,0.18)" />
        ))}
        <line x1="3" y1="-6.5" x2="3" y2="6.5" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
        <rect x="5"    y="-10.5" width="6.5" height="4"  rx="1.5" fill={TY} />
        <rect x="5"    y="6.5"   width="6.5" height="4"  rx="1.5" fill={TY} />
        <rect x="-1.5" y="-10.5" width="6.5" height="4"  rx="1.5" fill={TY} />
        <rect x="-1.5" y="6.5"   width="6.5" height="4"  rx="1.5" fill={TY} />
        <rect x="-11.5" y="-10.5" width="6.5" height="4" rx="1.5" fill={TY} />
        <rect x="-11.5" y="6.5"   width="6.5" height="4" rx="1.5" fill={TY} />
        <rect x="13"  y="-6"   width="2"   height="13"  rx="0.5" fill="rgba(255,245,180,0.30)" />
        <rect x="13.5" y="-5"  width="1.5" height="3.5" rx="0.3" fill={HL} />
        <rect x="13.5" y="1.5" width="1.5" height="3.5" rx="0.3" fill={HL} />
        <rect x="-15"  y="-5"  width="1.5" height="3.5" rx="0.3" fill={TL} />
        <rect x="-15"  y="1.5" width="1.5" height="3.5" rx="0.3" fill={TL} />
      </g>
    ),
  },
]

// Per-vehicle scale factor so the car fits within the 14-unit road width.
export const carScale = idx => {
  if (idx === 3 || idx === 5) return 0.68   // Limo, Coach — large
  if (idx === 4)              return 0.72   // Mini Bus
  return 0.80                               // Sedan, SUV, Sprinter
}

// Read selected car from localStorage, clamped to valid range.
export const savedCarIdx = () => {
  try {
    const v = parseInt(localStorage.getItem('et_car') || '0', 10)
    return Math.min(Math.max(0, isNaN(v) ? 0 : v), CARS.length - 1)
  } catch { return 0 }
}
