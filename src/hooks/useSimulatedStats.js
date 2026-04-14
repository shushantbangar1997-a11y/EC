import { useState, useEffect } from 'react'

export default function useSimulatedStats() {
  const [stats, setStats] = useState({ vehicles: 17, response: 4, rides: 43 })
  useEffect(() => {
    let timerId
    const schedule = () => {
      const delay = Math.floor(Math.random() * 25000) + 15000
      timerId = setTimeout(() => {
        setStats(s => {
          const rDelta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0
          return {
            vehicles: Math.max(10, Math.min(30, s.vehicles + 1)),
            response: Math.max(2, Math.min(8, s.response + rDelta)),
            rides: s.rides + 1,
          }
        })
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timerId)
  }, [])
  return stats
}
