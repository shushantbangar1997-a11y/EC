import React, { useEffect, useRef, useCallback } from 'react'
import { approximatePosition } from '../utils/priceEstimator'

const ELECTRIC_BLUE = 'rgba(14,165,233,'
const GOLD = '#F6C90E'

function lerp(a, b, t) { return a + (b - a) * t }

function makeRideDot(canvasW, canvasH, gridSpacingX, gridSpacingY) {
  const col = Math.floor(Math.random() * Math.floor(canvasW / gridSpacingX))
  const row = Math.floor(Math.random() * Math.floor(canvasH / gridSpacingY))
  const goHorizontal = Math.random() > 0.5
  const speed = Math.random() * 0.4 + 0.15
  return {
    x: col * gridSpacingX,
    y: row * gridSpacingY,
    col, row,
    goHorizontal,
    progress: Math.random(),
    speed,
    opacity: Math.random() * 0.5 + 0.3,
    trail: [],
  }
}

export default function NYCActivityCanvas({ pickup, dropoff, isMobile }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dotsRef = useRef([])
  const routeProgressRef = useRef(0)
  const routeVisibleRef = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    const gridX = isMobile ? 0 : 48
    const gridY = isMobile ? 0 : 40

    if (!isMobile) {
      ctx.lineWidth = 0.5
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      for (let x = 0; x <= W; x += gridX) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y <= H; y += gridY) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
    }

    dotsRef.current.forEach(dot => {
      dot.progress += dot.speed * 0.002
      if (dot.progress >= 1) {
        dot.progress = 0
        if (dot.goHorizontal) {
          dot.row = Math.floor(Math.random() * Math.floor(H / gridY || 1))
          dot.y = dot.row * gridY
          const dir = Math.random() > 0.5 ? 1 : -1
          dot.col = Math.floor(Math.random() * Math.floor(W / gridX || 1))
          dot.targetCol = dot.col + dir * (Math.floor(Math.random() * 4) + 2)
          dot.targetCol = Math.max(0, Math.min(Math.floor(W / gridX), dot.targetCol))
        } else {
          dot.col = Math.floor(Math.random() * Math.floor(W / gridX || 1))
          dot.x = dot.col * gridX
          const dir = Math.random() > 0.5 ? 1 : -1
          dot.row = Math.floor(Math.random() * Math.floor(H / gridY || 1))
          dot.targetRow = dot.row + dir * (Math.floor(Math.random() * 4) + 2)
          dot.targetRow = Math.max(0, Math.min(Math.floor(H / gridY), dot.targetRow))
        }
        dot.goHorizontal = !dot.goHorizontal
        dot.opacity = Math.random() * 0.5 + 0.3
      }

      let cx, cy
      if (dot.goHorizontal) {
        const startX = (dot.col || 0) * (isMobile ? W / 8 : gridX)
        const endX = (dot.targetCol || dot.col + 3) * (isMobile ? W / 8 : gridX)
        cx = lerp(startX, endX, dot.progress)
        cy = dot.y || dot.row * (isMobile ? H / 6 : gridY)
      } else {
        cx = dot.x || dot.col * (isMobile ? W / 8 : gridX)
        const startY = (dot.row || 0) * (isMobile ? H / 6 : gridY)
        const endY = (dot.targetRow || dot.row + 3) * (isMobile ? H / 6 : gridY)
        cy = lerp(startY, endY, dot.progress)
      }

      dot.trail.push({ x: cx, y: cy })
      if (dot.trail.length > 8) dot.trail.shift()

      dot.trail.forEach((pt, i) => {
        const alpha = (i / dot.trail.length) * dot.opacity * 0.4
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `${ELECTRIC_BLUE}${alpha})`
        ctx.fill()
      })

      ctx.beginPath()
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = `${ELECTRIC_BLUE}${dot.opacity})`
      ctx.shadowBlur = 6
      ctx.shadowColor = 'rgba(14,165,233,0.6)'
      ctx.fill()
      ctx.shadowBlur = 0
    })

    if (pickup && !isMobile) {
      const pos = approximatePosition(pickup, W, H)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2)
      ctx.fillStyle = GOLD
      ctx.shadowBlur = 20
      ctx.shadowColor = 'rgba(246,201,14,0.8)'
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(246,201,14,0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      if (dropoff) {
        const pos2 = approximatePosition(dropoff, W, H)
        ctx.beginPath()
        ctx.arc(pos2.x, pos2.y, 7, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(255,255,255,0.5)'
        ctx.fill()
        ctx.shadowBlur = 0

        routeProgressRef.current = Math.min(routeProgressRef.current + 0.008, 1)
        const t = routeProgressRef.current
        const endX = lerp(pos.x, pos2.x, t)
        const endY = lerp(pos.y, pos2.y, t)

        const grad = ctx.createLinearGradient(pos.x, pos.y, pos2.x, pos2.y)
        grad.addColorStop(0, 'rgba(246,201,14,0.8)')
        grad.addColorStop(1, 'rgba(255,255,255,0.6)')
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        routeProgressRef.current = 0
      }
    }

    animRef.current = requestAnimationFrame(draw)
  }, [pickup, dropoff, isMobile])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const W = canvas.width
      const H = canvas.height
      const gridX = 48
      const gridY = 40
      dotsRef.current = Array.from({ length: 28 }, () => {
        const col = Math.floor(Math.random() * Math.floor(W / gridX))
        const row = Math.floor(Math.random() * Math.floor(H / gridY))
        const goHorizontal = Math.random() > 0.5
        return {
          x: col * gridX,
          y: row * gridY,
          col, row,
          goHorizontal,
          progress: Math.random(),
          speed: Math.random() * 0.4 + 0.15,
          opacity: Math.random() * 0.5 + 0.3,
          trail: [],
          targetCol: col + 3,
          targetRow: row + 3,
        }
      })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    routeProgressRef.current = 0
  }, [pickup, dropoff])

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(draw)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'transparent', display: 'block' }}
    />
  )
}
