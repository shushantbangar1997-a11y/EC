import React, { useState, useCallback } from 'react'
import { FiShield, FiTruck, FiHeadphones } from 'react-icons/fi'
import DispatchPanel from '../components/DispatchPanel'
import NYCActivityCanvas from '../components/NYCActivityCanvas'

export default function Home() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')

  const handleRouteChange = useCallback((pu, do_) => {
    setPickup(pu)
    setDropoff(do_)
  }, [])

  return (
    <div style={{ background: '#050a0f' }} className="overflow-x-hidden">
      <section className="relative min-h-screen flex">

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,54,93,0.35) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96" style={{ background: 'radial-gradient(circle, rgba(246,201,14,0.03) 0%, transparent 70%)' }} />
        </div>

        <div className="hidden lg:block absolute inset-y-0 right-0 w-[42%]" style={{ background: '#050a0f' }}>
          <NYCActivityCanvas pickup={pickup} dropoff={dropoff} isMobile={false} />
          <div className="absolute inset-y-0 left-0 w-32 pointer-events-none" style={{ background: 'linear-gradient(to right, #050a0f, transparent)' }} />
        </div>

        <div className="relative z-10 w-full lg:w-[58%] min-h-screen flex items-center">
          <DispatchPanel onRouteChange={handleRouteChange} />
        </div>
      </section>

      <section className="py-10 border-t" style={{ background: '#070e1d', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: FiShield, label: 'Licensed & Insured', desc: 'Every driver vetted & covered' },
              { icon: FiTruck, label: '250+ Vehicles', desc: 'Sedans, SUVs, Sprinters & Coaches' },
              { icon: FiHeadphones, label: '24/7 Support', desc: 'Real humans, always available' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(246,201,14,0.08)', border: '1px solid rgba(246,201,14,0.18)' }}>
                  <Icon size={17} style={{ color: '#F6C90E' }} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-7">
            <a href="tel:+17186586000" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Need help?{' '}
              <span className="font-bold" style={{ color: 'rgba(246,201,14,0.8)' }}>(718) 658-6000</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
