import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { D, CARS, carScale, savedCarIdx } from './fleetCars'

/*
  Car-on-infinity-road brand mark.
  HIDDEN FEATURE: tap to open a fleet vehicle picker.
  Vehicle selection persisted to localStorage (key: et_car).
*/

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

export default function InfinityLogo({ size = 80 }) {
  const [carIdx, setCarIdx]       = useState(savedCarIdx)
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

  const svgW    = Math.round(size * 2.5)
  const svgH    = size
  const safeIdx = Math.min(Math.max(0, carIdx), CARS.length - 1)
  const car     = CARS[safeIdx]
  const scale   = carScale(safeIdx)

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <style>{CSS}</style>

      <svg
        width={svgW}
        height={svgH}
        viewBox="0 0 200 80"
        fill="none"
        aria-label="Everywhere Transfers — vehicle on infinity road"
        style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}
        onClick={openPicker}
      >
        <path d={D} stroke="rgba(255,255,255,0.07)" strokeWidth="28" strokeLinecap="round" />
        <path d={D} stroke="rgba(255,255,255,0.40)" strokeWidth="18" strokeLinecap="round" />
        <path d={D} stroke="#1c1c1c"                strokeWidth="14" strokeLinecap="round" />
        <path d={D} stroke="rgba(255,255,255,0.025)" strokeWidth="12" strokeLinecap="round" />
        <path d={D} stroke="rgba(255,215,50,0.75)"  strokeWidth="1.2" strokeLinecap="butt" strokeDasharray="6 8" />

        <g>
          <animateMotion dur="4.6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#ilRef" />
          </animateMotion>
          <ellipse cx="0" cy="0" rx="13" ry="5.5" fill="rgba(0,0,0,0.40)" />
          <ellipse cx="20" cy="-3" rx="9" ry="2.5"
            fill="rgba(255,248,180,0.18)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite' }}
          />
          <ellipse cx="20" cy="3" rx="9" ry="2.5"
            fill="rgba(255,248,180,0.18)"
            style={{ animation: 'beamPulse 2s ease-in-out infinite 1s' }}
          />
          <g transform={`scale(${scale})`}>
            {car.render('white')}
          </g>
        </g>

        <path id="ilRef" d={D} stroke="none" fill="none" />
      </svg>

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
            const ps = carScale(i) * 0.9
            return (
              <button
                key={i}
                title={c.label.replace('\n', ' ')}
                onClick={() => { setCarIdx(i); setOpen(false) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 6px 6px',
                  background: active ? 'rgba(255,255,255,0.13)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  width: 74,
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="64" height="32" viewBox="-16 -10 32 20" fill="none">
                  <g transform={`scale(${ps})`}>{c.render('rgba(255,255,255,0.90)')}</g>
                </svg>
                <span style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.04em',
                  color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.50)',
                  textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre', fontFamily: 'inherit',
                }}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>,
        document.body
      )}

      <p style={{
        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.20em',
        textTransform: 'lowercase', color: 'rgba(255,255,255,0.42)',
        marginTop: 10, fontFamily: 'inherit', userSelect: 'none', lineHeight: 1,
      }}>
        everywheretransfers.com
      </p>
    </div>
  )
}
