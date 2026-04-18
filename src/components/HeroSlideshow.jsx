import React, { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_SLIDES = [
  {
    srcDesktop: '/images/hero-1-desktop.png',
    srcMobile:  '/images/hero-1-mobile.png',
    alt: 'Black Mercedes sedan on rain-wet Fifth Avenue at night',
  },
  {
    srcDesktop: '/images/hero-2-desktop.png',
    srcMobile:  '/images/hero-2-mobile.png',
    alt: 'Black Cadillac Escalade outside JFK airport at dusk',
  },
  {
    srcDesktop: '/images/hero-3-desktop.png',
    srcMobile:  '/images/hero-3-mobile.png',
    alt: 'Executive Sprinter van on Brooklyn Bridge — NYC skyline',
  },
  {
    srcDesktop: '/images/hero-4-desktop.png',
    srcMobile:  '/images/hero-4-mobile.png',
    alt: 'Black Lincoln Navigator outside luxury Manhattan hotel',
  },
  {
    srcDesktop: '/images/hero-5-desktop.png',
    srcMobile:  '/images/hero-5-mobile.png',
    alt: 'Black stretch limousine on Park Avenue Manhattan at night',
  },
  {
    srcDesktop: '/images/hero-6-desktop.png',
    srcMobile:  '/images/hero-6-mobile.png',
    alt: 'Fleet of black luxury vehicles outside NYC corporate tower',
  },
]

const DEFAULT_SLIDE_MS = 5500

export default function HeroSlideshow({ images, slideMs, onSlideChange }) {
  const SLIDES = images && images.length > 0 ? images : DEFAULT_SLIDES
  const SLIDE_MS = slideMs || DEFAULT_SLIDE_MS
  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState({})
  const intervalRef = useRef(null)
  const [tick, setTick] = useState(0)

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActive(a => {
        const next = (a + 1) % SLIDES.length
        if (onSlideChange) onSlideChange(next)
        return next
      })
      setTick(t => t + 1)
    }, SLIDE_MS)
  }, [onSlideChange, SLIDE_MS, SLIDES.length])

  useEffect(() => {
    startTimer()
    return () => clearInterval(intervalRef.current)
  }, [startTimer])

  const goTo = (i) => {
    setActive(i)
    setTick(t => t + 1)
    if (onSlideChange) onSlideChange(i)
    startTimer()
  }

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === active ? 1 : 0,
            transition: prefersReduced ? 'none' : 'opacity 1000ms ease-in-out',
            zIndex: i === active ? 2 : 1,
          }}
        >
          {/*
            <picture> serves a different image source per screen size —
            phones (<= 640 px wide) get the 9:16 portrait image so the
            composition fills the tall screen correctly;
            desktops get the wide 16:9 landscape image.
            The browser downloads ONLY the matching source — no wasted bandwidth.
          */}
          <picture
            onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
            style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }}
          >
            {slide.srcMobile && (
              <source media="(max-width: 640px)" srcSet={slide.srcMobile} />
            )}
            <img
              src={slide.srcDesktop || slide.src}
              alt={slide.alt}
              onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                willChange: 'transform',
                animation: !prefersReduced && i === active && loaded[i]
                  ? `heroKenBurns ${SLIDE_MS * 1.6}ms ease-out forwards`
                  : 'none',
              }}
            />
          </picture>
        </div>
      ))}

      {/* Progress dots */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 pb-5"
        style={{ zIndex: 10 }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              height: 3,
              width: i === active ? 44 : 20,
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.30)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'width 300ms ease',
              padding: 0,
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {i === active && (
              <span
                key={tick}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#ffffff',
                  transformOrigin: 'left center',
                  animation: prefersReduced
                    ? 'none'
                    : `heroProgress ${SLIDE_MS}ms linear forwards`,
                  borderRadius: 9999,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
