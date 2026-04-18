import React, { useState, useEffect, useRef } from 'react'

/*
  Car-on-infinity-road brand mark.

  HIDDEN FEATURE: tap / click anywhere on the logo to open a transparent car
  picker with 34 vehicle options.  Selection is saved to localStorage.
  No visible UI hint — users discover it by tapping.

  Car coordinate system: centered at (0,0), nose pointing right (+X).
  Fits in x: -11 → 11, y: -5 → 5  (22 × 10 units).
  Road is 14 units wide, so there's 2 units of asphalt visible each side.
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

// ─── 34 Car definitions ──────────────────────────────────────────────────────
// Each render(c) returns SVG elements at (0,0) facing right (+X).
// c = body colour (white in animation, adjusted in picker).
const W = '#2a2a2a'    // wheel / tyre colour
const GL = 'rgba(20,25,40,0.60)'  // dark glass
const HL = 'rgba(255,235,80,0.95)'  // headlight amber
const TL = 'rgba(255,50,50,0.92)'   // tail light red
const LB = 'rgba(120,180,255,0.95)' // light bar blue

const CARS = [
  // 0 ── Sedan ──────────────────────────────────────────────────────────────
  { label: 'Sedan', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="3.2" fill={c} />
      <rect x="-5.5" y="-4.5" width="12" height="9" rx="2" fill={GL} />
      <rect x="3.5" y="-4.5" width="3" height="9" rx="1.5" fill="rgba(20,25,40,0.68)" />
      <rect x="-8" y="-3.5" width="3" height="7" rx="1.3" fill="rgba(20,25,40,0.45)" />
      <rect x="0.5" y="-7.2" width="3.5" height="2.2" rx="0.8" fill={c} />
      <rect x="0.5" y="5" width="3.5" height="2.2" rx="0.8" fill={c} />
      <rect x="3.5" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="3.5" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="9.5" y="-4" width="2" height="2" rx="0.5" fill={HL} />
      <rect x="9.5" y="2" width="2" height="2" rx="0.5" fill={HL} />
      <rect x="-11.5" y="-4" width="2" height="2" rx="0.5" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2" rx="0.5" fill={TL} />
    </g>
  )},

  // 1 ── Sports Coupe ───────────────────────────────────────────────────────
  { label: 'Coupe', render: c => (
    <g>
      <rect x="-10" y="-4.5" width="20" height="9" rx="4" fill={c} />
      <ellipse cx="1" cy="0" rx="6" ry="3.8" fill={GL} />
      <rect x="4.5" y="-3.5" width="2.5" height="7" rx="1.5" fill="rgba(20,25,40,0.70)" />
      <rect x="3" y="-7" width="5" height="2.5" rx="1" fill={W} />
      <rect x="3" y="4.5" width="5" height="2.5" rx="1" fill={W} />
      <rect x="-8" y="-7" width="5" height="2.5" rx="1" fill={W} />
      <rect x="-8" y="4.5" width="5" height="2.5" rx="1" fill={W} />
      <ellipse cx="10.5" cy="-2.5" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="10.5" cy="2.5" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="-10.5" cy="-2.5" rx="1.5" ry="1" fill={TL} />
      <ellipse cx="-10.5" cy="2.5" rx="1.5" ry="1" fill={TL} />
    </g>
  )},

  // 2 ── SUV ────────────────────────────────────────────────────────────────
  { label: 'SUV', render: c => (
    <g>
      <rect x="-11" y="-5.5" width="22" height="11" rx="2.5" fill={c} />
      <rect x="-6" y="-5" width="13" height="10" rx="1.5" fill={GL} />
      <rect x="-5.5" y="-4.5" width="3.5" height="9" rx="1.2" fill="rgba(20,25,40,0.4)" />
      <rect x="5.5" y="-4.5" width="3.5" height="9" rx="1.2" fill="rgba(20,25,40,0.68)" />
      <rect x="4" y="-8" width="6" height="3" rx="1.3" fill={W} />
      <rect x="4" y="5" width="6" height="3" rx="1.3" fill={W} />
      <rect x="-10" y="-8" width="6" height="3" rx="1.3" fill={W} />
      <rect x="-10" y="5" width="6" height="3" rx="1.3" fill={W} />
      <rect x="9.5" y="-4.5" width="2.5" height="2.5" rx="0.5" fill={HL} />
      <rect x="9.5" y="2" width="2.5" height="2.5" rx="0.5" fill={HL} />
      <rect x="-12" y="-4.5" width="2.5" height="2.5" rx="0.5" fill={TL} />
      <rect x="-12" y="2" width="2.5" height="2.5" rx="0.5" fill={TL} />
    </g>
  )},

  // 3 ── Pickup Truck ───────────────────────────────────────────────────────
  { label: 'Pickup', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="2" fill={c} />
      <line x1="-1" y1="-5" x2="-1" y2="5" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <rect x="-1" y="-5" width="12" height="10" rx="2" fill={`rgba(0,0,0,0.12)`} />
      <rect x="0.5" y="-4.5" width="6" height="9" rx="1.5" fill={GL} />
      <rect x="4" y="-8" width="6" height="3" rx="1.2" fill={W} />
      <rect x="4" y="5" width="6" height="3" rx="1.2" fill={W} />
      <rect x="-10" y="-8" width="6" height="3" rx="1.2" fill={W} />
      <rect x="-10" y="5" width="6" height="3" rx="1.2" fill={W} />
      <rect x="9.5" y="-4" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="9.5" y="1.5" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="-11.5" y="-4" width="2" height="2" rx="0.4" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2" rx="0.4" fill={TL} />
    </g>
  )},

  // 4 ── Minivan ────────────────────────────────────────────────────────────
  { label: 'Minivan', render: c => (
    <g>
      <rect x="-11" y="-5.5" width="22" height="11" rx="2" fill={c} />
      <rect x="-9" y="-4.5" width="16" height="9" rx="1.5" fill={GL} />
      <rect x="5" y="-4.5" width="3" height="9" rx="1" fill="rgba(20,25,40,0.68)" />
      <line x1="-1.5" y1="-4.5" x2="-1.5" y2="4.5" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />
      <rect x="4" y="-8.5" width="6" height="3" rx="1.2" fill={W} />
      <rect x="4" y="5.5" width="6" height="3" rx="1.2" fill={W} />
      <rect x="-10" y="-8.5" width="6" height="3" rx="1.2" fill={W} />
      <rect x="-10" y="5.5" width="6" height="3" rx="1.2" fill={W} />
      <rect x="9.5" y="-4.5" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="9.5" y="2" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="-11.5" y="-4.5" width="2" height="2.5" rx="0.4" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2.5" rx="0.4" fill={TL} />
    </g>
  )},

  // 5 ── Muscle Car ─────────────────────────────────────────────────────────
  { label: 'Muscle', render: c => (
    <g>
      <rect x="-11" y="-5.2" width="22" height="10.4" rx="2.5" fill={c} />
      <rect x="-4" y="-4.5" width="10" height="9" rx="2" fill={GL} />
      <rect x="3.5" y="-4.5" width="2.5" height="9" rx="1.2" fill="rgba(20,25,40,0.68)" />
      <rect x="-1.5" y="-5.2" width="4" height="1.2" rx="0.5" fill="rgba(0,0,0,0.3)" />
      <rect x="-1.5" y="4" width="4" height="1.2" rx="0.5" fill="rgba(0,0,0,0.3)" />
      <rect x="3.5" y="-8.2" width="6" height="3" rx="1.2" fill={W} />
      <rect x="3.5" y="5.2" width="6" height="3" rx="1.2" fill={W} />
      <rect x="-9.5" y="-8.2" width="6" height="3" rx="1.2" fill={W} />
      <rect x="-9.5" y="5.2" width="6" height="3" rx="1.2" fill={W} />
      <ellipse cx="11" cy="-3" rx="1.8" ry="1.2" fill={HL} />
      <ellipse cx="11" cy="3" rx="1.8" ry="1.2" fill={HL} />
      <ellipse cx="-11" cy="-3" rx="1.8" ry="1.2" fill={TL} />
      <ellipse cx="-11" cy="3" rx="1.8" ry="1.2" fill={TL} />
    </g>
  )},

  // 6 ── Station Wagon ──────────────────────────────────────────────────────
  { label: 'Wagon', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="2.5" fill={c} />
      <rect x="-9" y="-4.5" width="14" height="9" rx="1.5" fill={GL} />
      <rect x="2.5" y="-4.5" width="3" height="9" rx="1" fill="rgba(20,25,40,0.68)" />
      <rect x="-9.5" y="-4.5" width="3" height="9" rx="1" fill="rgba(20,25,40,0.40)" />
      <rect x="3.5" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="3.5" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="9.5" y="-4" width="2" height="2" rx="0.4" fill={HL} />
      <rect x="9.5" y="2" width="2" height="2" rx="0.4" fill={HL} />
      <rect x="-11.5" y="-4" width="2" height="2" rx="0.4" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2" rx="0.4" fill={TL} />
    </g>
  )},

  // 7 ── City Car / Mini ────────────────────────────────────────────────────
  { label: 'City Car', render: c => (
    <g>
      <rect x="-7.5" y="-5" width="15" height="10" rx="3.5" fill={c} />
      <rect x="-5" y="-4.5" width="9.5" height="9" rx="2" fill={GL} />
      <rect x="2" y="-4.5" width="3" height="9" rx="1.5" fill="rgba(20,25,40,0.68)" />
      <rect x="2" y="-7.5" width="4.5" height="2.5" rx="1" fill={W} />
      <rect x="2" y="5" width="4.5" height="2.5" rx="1" fill={W} />
      <rect x="-6.5" y="-7.5" width="4.5" height="2.5" rx="1" fill={W} />
      <rect x="-6.5" y="5" width="4.5" height="2.5" rx="1" fill={W} />
      <ellipse cx="8" cy="-3" rx="1.2" ry="0.9" fill={HL} />
      <ellipse cx="8" cy="3" rx="1.2" ry="0.9" fill={HL} />
      <ellipse cx="-8" cy="-3" rx="1.2" ry="0.9" fill={TL} />
      <ellipse cx="-8" cy="3" rx="1.2" ry="0.9" fill={TL} />
    </g>
  )},

  // 8 ── Luxury Sedan ───────────────────────────────────────────────────────
  { label: 'Luxury', render: c => (
    <g>
      <rect x="-12" y="-4.8" width="24" height="9.6" rx="3" fill={c} />
      <rect x="-4.5" y="-4" width="11" height="8" rx="1.8" fill={GL} />
      <rect x="4" y="-4" width="2.5" height="8" rx="1.2" fill="rgba(20,25,40,0.68)" />
      <rect x="-7.5" y="-3.5" width="3" height="7" rx="1.2" fill="rgba(20,25,40,0.40)" />
      <rect x="0.5" y="-6.8" width="3.5" height="2" rx="0.8" fill={c} />
      <rect x="0.5" y="4.8" width="3.5" height="2" rx="0.8" fill={c} />
      <rect x="4.5" y="-8" width="5.5" height="3.2" rx="1.2" fill={W} />
      <rect x="4.5" y="4.8" width="5.5" height="3.2" rx="1.2" fill={W} />
      <rect x="-10" y="-8" width="5.5" height="3.2" rx="1.2" fill={W} />
      <rect x="-10" y="4.8" width="5.5" height="3.2" rx="1.2" fill={W} />
      <ellipse cx="12" cy="-3" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="12" cy="3" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="-12" cy="-3" rx="1.5" ry="1" fill={TL} />
      <ellipse cx="-12" cy="3" rx="1.5" ry="1" fill={TL} />
    </g>
  )},

  // 9 ── Electric / Tesla-style ─────────────────────────────────────────────
  { label: 'Electric', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="4" fill={c} />
      <rect x="-5" y="-4.5" width="12" height="9" rx="2" fill={GL} />
      <rect x="4" y="-4.5" width="2.5" height="9" rx="1.5" fill="rgba(20,25,40,0.72)" />
      <rect x="-5.5" y="-4.5" width="2.5" height="9" rx="1.5" fill="rgba(20,25,40,0.50)" />
      <rect x="0.5" y="-6.8" width="3" height="1.8" rx="0.8" fill={c} />
      <rect x="0.5" y="5" width="3" height="1.8" rx="0.8" fill={c} />
      <rect x="4" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="4" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9.5" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9.5" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="9" y="-4.5" width="2.5" height="9" rx="0.8" fill="rgba(200,220,255,0.3)" />
      <ellipse cx="11" cy="-3" rx="1.3" ry="0.9" fill="rgba(200,230,255,0.95)" />
      <ellipse cx="11" cy="3" rx="1.3" ry="0.9" fill="rgba(200,230,255,0.95)" />
      <ellipse cx="-11" cy="-3" rx="1.3" ry="0.9" fill={TL} />
      <ellipse cx="-11" cy="3" rx="1.3" ry="0.9" fill={TL} />
    </g>
  )},

  // 10 ── Race Car (open cockpit) ───────────────────────────────────────────
  { label: 'Race Car', render: c => (
    <g>
      <ellipse cx="0" cy="0" rx="11" ry="4" fill={c} />
      <ellipse cx="2" cy="0" rx="4" ry="3" fill={GL} />
      <ellipse cx="-1" cy="0" rx="2.5" ry="2.2" fill="rgba(20,25,40,0.75)" />
      <rect x="-7" y="-6.5" width="3" height="2.5" rx="1" fill={W} />
      <rect x="-7" y="4" width="3" height="2.5" rx="1" fill={W} />
      <rect x="5" y="-6" width="3" height="2.5" rx="1" fill={W} />
      <rect x="5" y="3.5" width="3" height="2.5" rx="1" fill={W} />
      <rect x="-10" y="-5.5" width="5" height="11" rx="1" fill={`rgba(0,0,0,0.15)`} />
      <ellipse cx="11" cy="-2" rx="1.5" ry="0.9" fill={HL} />
      <ellipse cx="11" cy="2" rx="1.5" ry="0.9" fill={HL} />
    </g>
  )},

  // 11 ── Convertible ───────────────────────────────────────────────────────
  { label: 'Convertible', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="3.5" fill={c} />
      <rect x="-4" y="-4.2" width="10" height="8.4" rx="2" fill="rgba(30,30,30,0.9)" />
      <rect x="3" y="-4.2" width="2.5" height="8.4" rx="1.5" fill="rgba(30,30,30,0.6)" />
      <rect x="3" y="-7.5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="3" y="4.7" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-8.5" y="-7.5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-8.5" y="4.7" width="5.5" height="2.8" rx="1.2" fill={W} />
      <ellipse cx="11" cy="-3.2" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="11" cy="3.2" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="-11" cy="-3.2" rx="1.5" ry="1" fill={TL} />
      <ellipse cx="-11" cy="3.2" rx="1.5" ry="1" fill={TL} />
    </g>
  )},

  // 12 ── Hatchback ─────────────────────────────────────────────────────────
  { label: 'Hatchback', render: c => (
    <g>
      <rect x="-10" y="-5" width="20" height="10" rx="3" fill={c} />
      <rect x="-7" y="-4.5" width="13" height="9" rx="1.8" fill={GL} />
      <rect x="3.5" y="-4.5" width="2.5" height="9" rx="1.5" fill="rgba(20,25,40,0.70)" />
      <rect x="-7.5" y="-4.5" width="2.5" height="9" rx="1.5" fill="rgba(20,25,40,0.50)" />
      <rect x="3" y="-7.5" width="5" height="2.8" rx="1.2" fill={W} />
      <rect x="3" y="4.7" width="5" height="2.8" rx="1.2" fill={W} />
      <rect x="-8" y="-7.5" width="5" height="2.8" rx="1.2" fill={W} />
      <rect x="-8" y="4.7" width="5" height="2.8" rx="1.2" fill={W} />
      <ellipse cx="10.5" cy="-3" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="10.5" cy="3" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="-10.5" cy="-3" rx="1.5" ry="1" fill={TL} />
      <ellipse cx="-10.5" cy="3" rx="1.5" ry="1" fill={TL} />
    </g>
  )},

  // 13 ── Jeep / Off-road ───────────────────────────────────────────────────
  { label: 'Jeep', render: c => (
    <g>
      <rect x="-10" y="-5.5" width="20" height="11" rx="1.5" fill={c} />
      <rect x="-4" y="-4.8" width="9" height="9.6" rx="1" fill={GL} />
      <rect x="3.5" y="-4.8" width="2.5" height="9.6" rx="0.8" fill="rgba(20,25,40,0.68)" />
      <rect x="-4" y="-4.8" width="2.5" height="9.6" rx="0.8" fill="rgba(20,25,40,0.42)" />
      <rect x="3.5" y="-8.5" width="5.5" height="3.2" rx="1.5" fill={W} />
      <rect x="3.5" y="5.3" width="5.5" height="3.2" rx="1.5" fill={W} />
      <rect x="-9" y="-8.5" width="5.5" height="3.2" rx="1.5" fill={W} />
      <rect x="-9" y="5.3" width="5.5" height="3.2" rx="1.5" fill={W} />
      <rect x="9" y="-4.5" width="1.5" height="9" rx="0.5" fill="rgba(0,0,0,0.2)" />
      <rect x="9.5" y="-4" width="1.5" height="2" rx="0.3" fill={HL} />
      <rect x="9.5" y="2" width="1.5" height="2" rx="0.3" fill={HL} />
      <rect x="-11" y="-4" width="1.5" height="2" rx="0.3" fill={TL} />
      <rect x="-11" y="2" width="1.5" height="2" rx="0.3" fill={TL} />
    </g>
  )},

  // 14 ── Van / Delivery ────────────────────────────────────────────────────
  { label: 'Van', render: c => (
    <g>
      <rect x="-11" y="-5.5" width="22" height="11" rx="1.5" fill={c} />
      <rect x="2" y="-5" width="9" height="10" rx="1.2" fill={GL} />
      <rect x="-2" y="-5" width="4.5" height="10" rx="1" fill="rgba(20,25,40,0.30)" />
      <rect x="4" y="-8.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="4" y="5.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-9" y="-8.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-9" y="5.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="9.8" y="-4.5" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="9.8" y="2" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="-12" y="-4.5" width="2" height="2.5" rx="0.4" fill={TL} />
      <rect x="-12" y="2" width="2" height="2.5" rx="0.4" fill={TL} />
    </g>
  )},

  // 15 ── Vintage Classic ───────────────────────────────────────────────────
  { label: 'Vintage', render: c => (
    <g>
      <ellipse cx="-2" cy="0" rx="9.5" ry="4" fill={c} />
      <ellipse cx="5" cy="0" rx="4" ry="3" fill={c} />
      <ellipse cx="-4" cy="0" rx="4" ry="3.5" fill={c} />
      <ellipse cx="-1.5" cy="0" rx="5.5" ry="3" fill={GL} />
      <ellipse cx="3" cy="0" rx="2.5" ry="2.5" fill="rgba(20,25,40,0.65)" />
      <ellipse cx="5" cy="-7" rx="2.5" ry="2.5" fill={W} />
      <ellipse cx="5" cy="7" rx="2.5" ry="2.5" fill={W} />
      <ellipse cx="-5" cy="-7" rx="2.5" ry="2.5" fill={W} />
      <ellipse cx="-5" cy="7" rx="2.5" ry="2.5" fill={W} />
      <ellipse cx="9" cy="-2.5" rx="1.3" ry="0.8" fill={HL} />
      <ellipse cx="9" cy="2.5" rx="1.3" ry="0.8" fill={HL} />
      <ellipse cx="-10" cy="-2.5" rx="1.3" ry="0.8" fill={TL} />
      <ellipse cx="-10" cy="2.5" rx="1.3" ry="0.8" fill={TL} />
    </g>
  )},

  // 16 ── VW Beetle ─────────────────────────────────────────────────────────
  { label: 'Beetle', render: c => (
    <g>
      <ellipse cx="0" cy="0" rx="9.5" ry="5.5" fill={c} />
      <ellipse cx="0" cy="0" rx="6.5" ry="4.2" fill={GL} />
      <ellipse cx="1" cy="0" rx="5" ry="3.5" fill="rgba(20,25,40,0.60)" />
      <ellipse cx="5" cy="-7.5" rx="3" ry="3" fill={W} />
      <ellipse cx="5" cy="7.5" rx="3" ry="3" fill={W} />
      <ellipse cx="-5" cy="-7.5" rx="3" ry="3" fill={W} />
      <ellipse cx="-5" cy="7.5" rx="3" ry="3" fill={W} />
      <ellipse cx="9.5" cy="-3" rx="1.2" ry="0.8" fill={HL} />
      <ellipse cx="9.5" cy="3" rx="1.2" ry="0.8" fill={HL} />
      <ellipse cx="-9.5" cy="-3" rx="1.2" ry="0.8" fill={TL} />
      <ellipse cx="-9.5" cy="3" rx="1.2" ry="0.8" fill={TL} />
    </g>
  )},

  // 17 ── Smart Car ─────────────────────────────────────────────────────────
  { label: 'Smart', render: c => (
    <g>
      <rect x="-6" y="-5" width="12" height="10" rx="3" fill={c} />
      <rect x="-4" y="-4.5" width="9.5" height="9" rx="2" fill={GL} />
      <rect x="2.5" y="-4.5" width="3" height="9" rx="1.5" fill="rgba(20,25,40,0.70)" />
      <rect x="1.5" y="-7.5" width="4" height="2.5" rx="1" fill={W} />
      <rect x="1.5" y="5" width="4" height="2.5" rx="1" fill={W} />
      <rect x="-5.5" y="-7.5" width="4" height="2.5" rx="1" fill={W} />
      <rect x="-5.5" y="5" width="4" height="2.5" rx="1" fill={W} />
      <ellipse cx="6.5" cy="-3" rx="1" ry="0.8" fill={HL} />
      <ellipse cx="6.5" cy="3" rx="1" ry="0.8" fill={HL} />
      <ellipse cx="-6.5" cy="-3" rx="1" ry="0.8" fill={TL} />
      <ellipse cx="-6.5" cy="3" rx="1" ry="0.8" fill={TL} />
    </g>
  )},

  // 18 ── Limousine ─────────────────────────────────────────────────────────
  { label: 'Limo', render: c => (
    <g>
      <rect x="-13" y="-4.5" width="26" height="9" rx="2.8" fill={c} />
      <rect x="-8" y="-3.8" width="17" height="7.6" rx="1.5" fill={GL} />
      <rect x="6" y="-3.8" width="2.8" height="7.6" rx="1.2" fill="rgba(20,25,40,0.70)" />
      <rect x="-9" y="-3.8" width="2.8" height="7.6" rx="1.2" fill="rgba(20,25,40,0.42)" />
      <rect x="-2" y="-3.8" width="0.7" height="7.6" fill="rgba(0,0,0,0.2)" />
      <rect x="5" y="-7.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="5" y="4.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-10.5" y="-7.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-10.5" y="4.5" width="5.5" height="3" rx="1.2" fill={W} />
      <ellipse cx="13" cy="-2.8" rx="1.3" ry="0.9" fill={HL} />
      <ellipse cx="13" cy="2.8" rx="1.3" ry="0.9" fill={HL} />
      <ellipse cx="-13" cy="-2.8" rx="1.3" ry="0.9" fill={TL} />
      <ellipse cx="-13" cy="2.8" rx="1.3" ry="0.9" fill={TL} />
    </g>
  )},

  // 19 ── Crossover ─────────────────────────────────────────────────────────
  { label: 'Crossover', render: c => (
    <g>
      <rect x="-11" y="-5.2" width="22" height="10.4" rx="3" fill={c} />
      <rect x="-7" y="-4.8" width="14" height="9.6" rx="1.8" fill={GL} />
      <rect x="4" y="-4.8" width="3" height="9.6" rx="1.2" fill="rgba(20,25,40,0.68)" />
      <rect x="-7.5" y="-4.8" width="3" height="9.6" rx="1.2" fill="rgba(20,25,40,0.42)" />
      <rect x="0.5" y="-7" width="3.5" height="1.8" rx="0.7" fill={c} />
      <rect x="0.5" y="5.2" width="3.5" height="1.8" rx="0.7" fill={c} />
      <rect x="4" y="-8.2" width="5.5" height="3" rx="1.3" fill={W} />
      <rect x="4" y="5.2" width="5.5" height="3" rx="1.3" fill={W} />
      <rect x="-9.5" y="-8.2" width="5.5" height="3" rx="1.3" fill={W} />
      <rect x="-9.5" y="5.2" width="5.5" height="3" rx="1.3" fill={W} />
      <rect x="9.5" y="-4.2" width="2" height="2.2" rx="0.4" fill={HL} />
      <rect x="9.5" y="2" width="2" height="2.2" rx="0.4" fill={HL} />
      <rect x="-11.5" y="-4.2" width="2" height="2.2" rx="0.4" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2.2" rx="0.4" fill={TL} />
    </g>
  )},

  // 20 ── Cybertruck ────────────────────────────────────────────────────────
  { label: 'Cybertruck', render: c => (
    <g>
      <polygon points="11,-3 11,3 -8,5 -11,3 -11,-3 -8,-5" fill={c} />
      <polygon points="3,-4 8,-2.5 8,2.5 3,4 -5,4 -5,-4" fill={GL} />
      <polygon points="7,-2.5 9,-2 9,2 7,2.5" fill="rgba(20,25,40,0.68)" />
      <rect x="3" y="-8" width="5.5" height="3" rx="0.5" fill={W} />
      <rect x="3" y="5" width="5.5" height="3" rx="0.5" fill={W} />
      <rect x="-9" y="-8" width="5.5" height="3" rx="0.5" fill={W} />
      <rect x="-9" y="5" width="5.5" height="3" rx="0.5" fill={W} />
      <rect x="10.5" y="-2.5" width="1.5" height="5" rx="0.3" fill="rgba(200,230,255,0.9)" />
      <rect x="-12" y="-2.5" width="1.5" height="5" rx="0.3" fill={TL} />
    </g>
  )},

  // 21 ── Formula 1 ─────────────────────────────────────────────────────────
  { label: 'F1', render: c => (
    <g>
      <ellipse cx="1" cy="0" rx="12" ry="2.8" fill={c} />
      <ellipse cx="3" cy="0" rx="3.5" ry="2.2" fill={GL} />
      <ellipse cx="3" cy="0" rx="2.5" ry="1.8" fill="rgba(20,25,40,0.70)" />
      <rect x="-1" y="-6" width="2.5" height="12" rx="1" fill={`rgba(255,255,255,0.6)`} />
      <rect x="-5" y="-6" width="2.5" height="2.5" rx="1" fill={W} />
      <rect x="-5" y="3.5" width="2.5" height="2.5" rx="1" fill={W} />
      <rect x="7" y="-5.5" width="2.5" height="2.5" rx="1" fill={W} />
      <rect x="7" y="3" width="2.5" height="2.5" rx="1" fill={W} />
      <rect x="-12" y="-1" width="4" height="2" rx="0.8" fill="rgba(0,0,0,0.3)" />
      <ellipse cx="12.5" cy="0" rx="1.2" ry="1.5" fill={HL} />
    </g>
  )},

  // 22 ── Italian Sports (Ferrari-style) ────────────────────────────────────
  { label: 'Sports GT', render: c => (
    <g>
      <ellipse cx="0" cy="0" rx="11.5" ry="4.8" fill={c} />
      <ellipse cx="1" cy="0" rx="7" ry="3.8" fill={GL} />
      <ellipse cx="4" cy="0" rx="3.5" ry="3" fill="rgba(20,25,40,0.70)" />
      <rect x="-0.5" y="-6.8" width="3.5" height="2" rx="0.8" fill={c} />
      <rect x="-0.5" y="4.8" width="3.5" height="2" rx="0.8" fill={c} />
      <rect x="3.5" y="-7.8" width="5.5" height="3" rx="1.5" fill={W} />
      <rect x="3.5" y="4.8" width="5.5" height="3" rx="1.5" fill={W} />
      <rect x="-9" y="-7.5" width="5.5" height="3" rx="1.5" fill={W} />
      <rect x="-9" y="4.5" width="5.5" height="3" rx="1.5" fill={W} />
      <rect x="-10" y="-4.5" width="5" height="9" rx="1" fill="rgba(200,0,0,0.5)" />
      <ellipse cx="11.5" cy="-2.5" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="11.5" cy="2.5" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="-11.5" cy="-2.5" rx="1.5" ry="1" fill={TL} />
      <ellipse cx="-11.5" cy="2.5" rx="1.5" ry="1" fill={TL} />
    </g>
  )},

  // 23 ── American Muscle (Dodge-style) ─────────────────────────────────────
  { label: 'Muscle V2', render: c => (
    <g>
      <rect x="-11.5" y="-5.5" width="23" height="11" rx="2.2" fill={c} />
      <rect x="-4" y="-5" width="11" height="10" rx="2" fill={GL} />
      <rect x="4.5" y="-5" width="2.8" height="10" rx="1.2" fill="rgba(20,25,40,0.70)" />
      <rect x="-4.5" y="-5" width="2.8" height="10" rx="1.2" fill="rgba(20,25,40,0.42)" />
      <rect x="-3" y="-5.5" width="7.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.25)" />
      <rect x="-3" y="4" width="7.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.25)" />
      <rect x="4" y="-8.5" width="6" height="3.2" rx="1.3" fill={W} />
      <rect x="4" y="5.3" width="6" height="3.2" rx="1.3" fill={W} />
      <rect x="-10" y="-8.5" width="6" height="3.2" rx="1.3" fill={W} />
      <rect x="-10" y="5.3" width="6" height="3.2" rx="1.3" fill={W} />
      <rect x="10" y="-4.5" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="10" y="2" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="-12" y="-4.5" width="2" height="2.5" rx="0.4" fill={TL} />
      <rect x="-12" y="2" width="2" height="2.5" rx="0.4" fill={TL} />
    </g>
  )},

  // 24 ── Japanese Sports (Supra-style) ─────────────────────────────────────
  { label: 'JDM', render: c => (
    <g>
      <ellipse cx="-1" cy="0" rx="10.5" ry="4.5" fill={c} />
      <ellipse cx="2" cy="0" rx="6" ry="3.5" fill={GL} />
      <ellipse cx="4.5" cy="0" rx="3.5" ry="2.8" fill="rgba(20,25,40,0.68)" />
      <rect x="-0.5" y="-6.5" width="3.5" height="2" rx="0.8" fill={c} />
      <rect x="-0.5" y="4.5" width="3.5" height="2" rx="0.8" fill={c} />
      <rect x="-11.5" y="-2" width="3" height="4" rx="0.8" fill="rgba(0,0,0,0.3)" />
      <rect x="4" y="-7.5" width="5" height="3" rx="1.3" fill={W} />
      <rect x="4" y="4.5" width="5" height="3" rx="1.3" fill={W} />
      <rect x="-8" y="-7.5" width="5" height="3" rx="1.3" fill={W} />
      <rect x="-8" y="4.5" width="5" height="3" rx="1.3" fill={W} />
      <ellipse cx="10.5" cy="-2.8" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="10.5" cy="2.8" rx="1.5" ry="1" fill={HL} />
      <ellipse cx="-10.5" cy="-2.8" rx="1.5" ry="1" fill={TL} />
      <ellipse cx="-10.5" cy="2.8" rx="1.5" ry="1" fill={TL} />
    </g>
  )},

  // 25 ── Taxi ──────────────────────────────────────────────────────────────
  { label: 'Taxi', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="3.2" fill="rgba(255,210,0,1)" />
      <rect x="-5.5" y="-4.5" width="12" height="9" rx="2" fill={GL} />
      <rect x="3.5" y="-4.5" width="3" height="9" rx="1.5" fill="rgba(20,25,40,0.68)" />
      <rect x="-8" y="-3.5" width="3" height="7" rx="1.3" fill="rgba(20,25,40,0.45)" />
      <rect x="-2.5" y="-7.5" width="5" height="3" rx="0.8" fill="rgba(0,0,0,0.7)" />
      <rect x="-11.5" y="-1" width="3" height="2" rx="0.3" fill="rgba(0,0,0,0.4)" />
      <rect x="3.5" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="3.5" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="9.5" y="-4" width="2" height="2" rx="0.4" fill={HL} />
      <rect x="9.5" y="2" width="2" height="2" rx="0.4" fill={HL} />
      <rect x="-11.5" y="-4" width="2" height="2" rx="0.4" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2" rx="0.4" fill={TL} />
    </g>
  )},

  // 26 ── Police Car ────────────────────────────────────────────────────────
  { label: 'Police', render: c => (
    <g>
      <rect x="-11" y="-5" width="22" height="10" rx="3.2" fill="rgba(20,20,80,1)" />
      <rect x="-5.5" y="-4.5" width="12" height="9" rx="2" fill={GL} />
      <rect x="3.5" y="-4.5" width="3" height="9" rx="1.5" fill="rgba(20,25,40,0.68)" />
      <rect x="-8" y="-3.5" width="3" height="7" rx="1.3" fill="rgba(20,25,40,0.45)" />
      <rect x="-3" y="-7" width="3" height="1.8" rx="0.5" fill="rgba(0,100,255,0.9)" />
      <rect x="-0.5" y="-7" width="3" height="1.8" rx="0.5" fill="rgba(255,30,30,0.9)" />
      <rect x="3.5" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="3.5" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="-7.8" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="-9" y="5" width="5.5" height="2.8" rx="1.2" fill={W} />
      <rect x="9.5" y="-4" width="2" height="2" rx="0.4" fill={LB} />
      <rect x="9.5" y="2" width="2" height="2" rx="0.4" fill={LB} />
      <rect x="-11.5" y="-4" width="2" height="2" rx="0.4" fill={TL} />
      <rect x="-11.5" y="2" width="2" height="2" rx="0.4" fill={TL} />
    </g>
  )},

  // 27 ── Ambulance ─────────────────────────────────────────────────────────
  { label: 'Ambulance', render: c => (
    <g>
      <rect x="-11" y="-5.5" width="22" height="11" rx="1.5" fill="rgba(240,240,240,1)" />
      <rect x="2" y="-5" width="9" height="10" rx="1.2" fill={GL} />
      <rect x="-3.5" y="-2.5" width="7" height="5" rx="0.5" fill="rgba(220,0,0,0.8)" />
      <rect x="-0.5" y="-3.5" width="1" height="7" fill="rgba(255,255,255,0.9)" />
      <rect x="-3.5" y="-0.5" width="7" height="1" fill="rgba(255,255,255,0.9)" />
      <rect x="4" y="-8.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="4" y="5.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-9" y="-8.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-9" y="5.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="9.8" y="-4.5" width="2" height="2.5" rx="0.4" fill="rgba(255,50,50,0.9)" />
      <rect x="9.8" y="2" width="2" height="2.5" rx="0.4" fill="rgba(255,50,50,0.9)" />
      <rect x="-12" y="-4.5" width="2" height="2.5" rx="0.4" fill={TL} />
      <rect x="-12" y="2" width="2" height="2.5" rx="0.4" fill={TL} />
    </g>
  )},

  // 28 ── Fire Truck ────────────────────────────────────────────────────────
  { label: 'Fire Truck', render: c => (
    <g>
      <rect x="-12" y="-5.5" width="24" height="11" rx="1.5" fill="rgba(220,30,30,1)" />
      <rect x="4" y="-5" width="8" height="10" rx="1.2" fill={GL} />
      <rect x="-11" y="-4" width="15" height="8" rx="1" fill="rgba(200,25,25,0.5)" />
      <rect x="-6" y="-2" width="12" height="4" rx="0.5" fill="rgba(220,180,0,0.5)" />
      <rect x="4" y="-8.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="4" y="5.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-10" y="-8.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-10" y="5.5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="11" y="-4.5" width="2" height="2.5" rx="0.4" fill="rgba(255,200,0,0.9)" />
      <rect x="11" y="2" width="2" height="2.5" rx="0.4" fill="rgba(255,200,0,0.9)" />
      <rect x="-13" y="-4.5" width="2" height="2.5" rx="0.4" fill={TL} />
      <rect x="-13" y="2" width="2" height="2.5" rx="0.4" fill={TL} />
    </g>
  )},

  // 29 ── Monster Truck ─────────────────────────────────────────────────────
  { label: 'Monster', render: c => (
    <g>
      <rect x="-9" y="-4.5" width="18" height="9" rx="2" fill={c} />
      <rect x="-4" y="-4" width="10" height="8" rx="1.5" fill={GL} />
      <rect x="3.5" y="-4" width="2.5" height="8" rx="1.2" fill="rgba(20,25,40,0.68)" />
      <ellipse cx="5" cy="-8" rx="4.5" ry="4.5" fill={W} />
      <ellipse cx="5" cy="8" rx="4.5" ry="4.5" fill={W} />
      <ellipse cx="-5" cy="-8" rx="4.5" ry="4.5" fill={W} />
      <ellipse cx="-5" cy="8" rx="4.5" ry="4.5" fill={W} />
      <ellipse cx="5" cy="-8" rx="2.5" ry="2.5" fill="#555" />
      <ellipse cx="5" cy="8" rx="2.5" ry="2.5" fill="#555" />
      <ellipse cx="-5" cy="-8" rx="2.5" ry="2.5" fill="#555" />
      <ellipse cx="-5" cy="8" rx="2.5" ry="2.5" fill="#555" />
      <ellipse cx="10" cy="-3" rx="1.3" ry="0.9" fill={HL} />
      <ellipse cx="10" cy="3" rx="1.3" ry="0.9" fill={HL} />
      <ellipse cx="-10" cy="-3" rx="1.3" ry="0.9" fill={TL} />
      <ellipse cx="-10" cy="3" rx="1.3" ry="0.9" fill={TL} />
    </g>
  )},

  // 30 ── Roadster ──────────────────────────────────────────────────────────
  { label: 'Roadster', render: c => (
    <g>
      <ellipse cx="0" cy="0" rx="10.5" ry="4" fill={c} />
      <ellipse cx="2" cy="0" rx="6" ry="3" fill="rgba(40,40,40,0.9)" />
      <ellipse cx="4" cy="0" rx="3" ry="2.2" fill="rgba(20,25,40,0.6)" />
      <rect x="3" y="-7" width="5" height="2.8" rx="1.3" fill={W} />
      <rect x="3" y="4.2" width="5" height="2.8" rx="1.3" fill={W} />
      <rect x="-8" y="-6.8" width="5" height="2.8" rx="1.3" fill={W} />
      <rect x="-8" y="4" width="5" height="2.8" rx="1.3" fill={W} />
      <ellipse cx="11" cy="-2" rx="1.3" ry="0.9" fill={HL} />
      <ellipse cx="11" cy="2" rx="1.3" ry="0.9" fill={HL} />
      <ellipse cx="-11" cy="-2" rx="1.3" ry="0.9" fill={TL} />
      <ellipse cx="-11" cy="2" rx="1.3" ry="0.9" fill={TL} />
    </g>
  )},

  // 31 ── Dune Buggy ────────────────────────────────────────────────────────
  { label: 'Buggy', render: c => (
    <g>
      <ellipse cx="0" cy="0" rx="8" ry="4.5" fill={c} />
      <ellipse cx="1" cy="0" rx="5" ry="3.5" fill="rgba(30,30,30,0.85)" />
      <ellipse cx="1.5" cy="0" rx="3" ry="2.5" fill="rgba(20,25,40,0.60)" />
      <ellipse cx="5" cy="-8" rx="3.8" ry="3.8" fill={W} />
      <ellipse cx="5" cy="8" rx="3.8" ry="3.8" fill={W} />
      <ellipse cx="-4" cy="-8" rx="3.8" ry="3.8" fill={W} />
      <ellipse cx="-4" cy="8" rx="3.8" ry="3.8" fill={W} />
      <ellipse cx="5" cy="-8" rx="2" ry="2" fill="#444" />
      <ellipse cx="5" cy="8" rx="2" ry="2" fill="#444" />
      <ellipse cx="-4" cy="-8" rx="2" ry="2" fill="#444" />
      <ellipse cx="-4" cy="8" rx="2" ry="2" fill="#444" />
      <ellipse cx="9" cy="-2.5" rx="1.2" ry="0.8" fill={HL} />
      <ellipse cx="9" cy="2.5" rx="1.2" ry="0.8" fill={HL} />
    </g>
  )},

  // 32 ── Crew Cab Pickup ───────────────────────────────────────────────────
  { label: 'Crew Cab', render: c => (
    <g>
      <rect x="-12" y="-5" width="24" height="10" rx="2" fill={c} />
      <line x1="1" y1="-5" x2="1" y2="5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      <rect x="1.5" y="-4.5" width="10.5" height="9" rx="1.5" fill={GL} />
      <rect x="8.5" y="-4.5" width="3" height="9" rx="1.2" fill="rgba(20,25,40,0.68)" />
      <rect x="1.5" y="-4.5" width="7.5" height="9" rx="1.5" fill={GL} />
      <rect x="5" y="-8" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="5" y="5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-10.5" y="-8" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="-10.5" y="5" width="5.5" height="3" rx="1.2" fill={W} />
      <rect x="10.5" y="-4" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="10.5" y="1.5" width="2" height="2.5" rx="0.4" fill={HL} />
      <rect x="-12.5" y="-4" width="2" height="2" rx="0.4" fill={TL} />
      <rect x="-12.5" y="2" width="2" height="2" rx="0.4" fill={TL} />
    </g>
  )},

  // 33 ── Bus ───────────────────────────────────────────────────────────────
  { label: 'Bus', render: c => (
    <g>
      <rect x="-13" y="-5.5" width="26" height="11" rx="1.2" fill="rgba(255,200,0,1)" />
      <rect x="-11" y="-4.8" width="22" height="9.6" rx="0.8" fill={GL} />
      {[-8.5,-5.5,-2.5,0.5,3.5,6.5].map(x => (
        <rect key={x} x={x} y="-4.5" width="2.2" height="9" rx="0.5" fill="rgba(0,0,0,0.18)" />
      ))}
      <rect x="9" y="-4.5" width="3.5" height="9" rx="0.8" fill="rgba(20,25,40,0.65)" />
      <rect x="5" y="-8.5" width="5.5" height="3" rx="1" fill={W} />
      <rect x="5" y="5.5" width="5.5" height="3" rx="1" fill={W} />
      <rect x="-10.5" y="-8.5" width="5.5" height="3" rx="1" fill={W} />
      <rect x="-10.5" y="5.5" width="5.5" height="3" rx="1" fill={W} />
      <rect x="11" y="-4.5" width="2.5" height="9" rx="0.5" fill="rgba(255,150,0,0.6)" />
      <rect x="-14" y="-4.5" width="2.5" height="2.5" rx="0.4" fill={TL} />
      <rect x="-14" y="2" width="2.5" height="2.5" rx="0.4" fill={TL} />
    </g>
  )},
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
  from { opacity: 0; transform: translateX(-50%) translateY(-4px) scale(0.97); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
}
`

// ─── Component ───────────────────────────────────────────────────────────────
export default function InfinityLogo({ size = 80 }) {
  const [carIdx, setCarIdx] = useState(() => {
    try { return Math.min(parseInt(localStorage.getItem('et_car') || '0', 10), CARS.length - 1) }
    catch { return 0 }
  })
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem('et_car', carIdx) } catch {}
  }, [carIdx])

  useEffect(() => {
    if (!open) return
    const close = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const svgW = Math.round(size * 2.5)
  const svgH = size
  const car  = CARS[carIdx]

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{CSS}</style>

      {/* ── Logo SVG (clickable to open picker) ─────────────────────────── */}
      <svg
        width={svgW}
        height={svgH}
        viewBox="0 0 200 80"
        fill="none"
        aria-label="Everywhere Transfers — car on infinity road"
        style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        {/* ① Ambient glow */}
        <path d={D} stroke="rgba(255,255,255,0.07)" strokeWidth="28" strokeLinecap="round" />
        {/* ② White edge band */}
        <path d={D} stroke="rgba(255,255,255,0.40)" strokeWidth="18" strokeLinecap="round" />
        {/* ③ Asphalt */}
        <path d={D} stroke="#1c1c1c" strokeWidth="14" strokeLinecap="round" />
        {/* Surface texture */}
        <path d={D} stroke="rgba(255,255,255,0.025)" strokeWidth="12" strokeLinecap="round" />
        {/* ④ Yellow dashed centre */}
        <path d={D} stroke="rgba(255,215,50,0.75)" strokeWidth="1.2" strokeLinecap="butt" strokeDasharray="6 8" />

        {/* ── Animated car ──────────────────────────────────────────────── */}
        <g>
          <animateMotion dur="4.6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#infinityRef" />
          </animateMotion>

          {/* Ground shadow */}
          <ellipse cx="0" cy="0" rx="13" ry="5" fill="rgba(0,0,0,0.45)" />

          {/* Headlight beams */}
          <ellipse cx="20" cy="-3" rx="9" ry="2.6"
            fill="rgba(255,248,180,0.20)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite' }}
          />
          <ellipse cx="20" cy="3" rx="9" ry="2.6"
            fill="rgba(255,248,180,0.20)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite 1s' }}
          />

          {/* Selected car, scaled to fit road (14 units wide) */}
          <g transform="scale(0.82)">
            {car.render('white')}
          </g>
        </g>

        <path id="infinityRef" d={D} stroke="none" fill="none" />
      </svg>

      {/* ── Hidden car picker ────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 10,
            background: 'rgba(8,8,8,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '10px 8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 52px)',
            gap: 4,
            zIndex: 999,
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            animation: 'pickerIn 0.18s ease-out forwards',
          }}
        >
          {CARS.map((c, i) => (
            <button
              key={i}
              title={c.label}
              onClick={() => { setCarIdx(i); setOpen(false) }}
              style={{
                width: 52,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: carIdx === i ? 'rgba(255,255,255,0.14)' : 'transparent',
                border: carIdx === i
                  ? '1px solid rgba(255,255,255,0.38)'
                  : '1px solid transparent',
                borderRadius: 7,
                cursor: 'pointer',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { if (carIdx !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (carIdx !== i) e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="46" height="24" viewBox="-13 -8 26 16" fill="none">
                {c.render('rgba(255,255,255,0.88)')}
              </svg>
            </button>
          ))}
        </div>
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
