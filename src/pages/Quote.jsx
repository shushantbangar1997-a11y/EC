import React, { useEffect } from 'react'
import QuoteForm from '../components/QuoteForm'

const TRUST_BADGES = [
  { icon: '✈️', label: 'Flight Tracking' },
  { icon: '🤝', label: 'Meet & Greet' },
  { icon: '💰', label: 'Fixed Pricing' },
  { icon: '⭐', label: '5-Star Rated' },
]

export default function Quote() {
  useEffect(() => {
    document.title = 'Get a Free Quote | Everywhere Cars NYC Car Service'
    let meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute('content', 'Get an instant quote for NYC airport transfers, car service to JFK, LGA, EWR, and more. No registration required. Fixed prices, professional drivers.')
    } else {
      meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = 'Get an instant quote for NYC airport transfers, car service to JFK, LGA, EWR, and more. No registration required. Fixed prices, professional drivers.'
      document.head.appendChild(meta)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16 px-4 text-center">
        <p className="text-yellow-400 font-semibold text-sm uppercase tracking-widest mb-3">No Registration Required</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Get a Free Quote</h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto">
          NYC's premier car service. Fixed prices, professional drivers, instant confirmation.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {TRUST_BADGES.map(b => (
            <div key={b.label} className="flex items-center gap-2 text-sm text-blue-100">
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom max-w-2xl px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <QuoteForm />
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">Prefer to call?</p>
          <a href="tel:+17186586000" className="text-primary-800 font-bold text-lg hover:text-primary-900">
            (718) 658-6000
          </a>
        </div>
      </div>
    </div>
  )
}
