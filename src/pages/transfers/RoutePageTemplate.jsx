import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import QuoteForm from '../../components/QuoteForm'

const TRUST_BULLETS = [
  { icon: '✈️', title: 'Flight Tracking', desc: 'We monitor your flight in real-time and adjust for delays.' },
  { icon: '🤝', title: 'Meet & Greet', desc: 'Your driver waits in arrivals with a name sign.' },
  { icon: '💰', title: 'Fixed Price', desc: 'No surge pricing. The price you see is the price you pay.' },
]

export default function RoutePageTemplate({
  slug,
  h1,
  metaTitle,
  metaDescription,
  priceRange,
  travelTime,
  vehicleRecommendation,
  description,
  fleetImage,
  faqs,
  prefillPickup,
  prefillDropoff,
}) {
  useEffect(() => {
    document.title = metaTitle
    let meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute('content', metaDescription)
    } else {
      meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = metaDescription
      document.head.appendChild(meta)
    }
  }, [metaTitle, metaDescription])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', transition: 'background 300ms ease' }}>
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-20 px-4">
        <div className="container-custom max-w-4xl text-center">
          <p className="text-yellow-400 font-semibold text-sm uppercase tracking-widest mb-4">NYC Car Service</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{h1}</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8">{description}</p>

          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
              <p className="text-yellow-400 font-bold text-2xl">{priceRange}</p>
              <p className="text-blue-200 text-xs mt-1 uppercase tracking-wide">Estimated Price</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
              <p className="text-yellow-400 font-bold text-2xl">{travelTime}</p>
              <p className="text-blue-200 text-xs mt-1 uppercase tracking-wide">Typical Travel Time</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
              <p className="text-yellow-400 font-bold text-2xl">{vehicleRecommendation}</p>
              <p className="text-blue-200 text-xs mt-1 uppercase tracking-wide">Recommended Vehicle</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-10 px-4 border-b border-gray-100">
        <div className="container-custom max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUST_BULLETS.map(b => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="text-3xl">{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{b.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom max-w-4xl px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
              <img
                src={fleetImage || '/logo.png'}
                alt={`${h1} - Everywhere Cars fleet`}
                className="w-full h-56 object-cover"
                onError={e => { e.target.src = '/logo.png'; e.target.className = 'w-full h-40 object-contain p-6' }}
              />
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-3">Why Book With Us?</h3>
                <ul className="space-y-2">
                  {['Licensed & insured', 'Professional chauffeurs', '24/7 availability', 'All major airports covered', 'Child seats available'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 text-center">
              <p className="text-primary-800 font-semibold text-sm mb-2">Need help? Call us directly</p>
              <a href="tel:+17186586000" className="text-primary-900 font-bold text-xl hover:underline">
                (718) 658-6000
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Transfer</h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <QuoteForm prefillPickup={prefillPickup} prefillDropoff={prefillDropoff} />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-primary-800 transition-colors">
                  {faq.q}
                  <FiArrowRight size={16} className="flex-shrink-0 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to Ride?</h2>
          <p className="text-blue-200 mb-6">Get your free quote now. No account needed, no credit card required.</p>
          <Link
            to="/quote"
            className="inline-flex items-center gap-2 bg-yellow-400 text-primary-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-colors text-lg"
          >
            Get a Free Quote <FiArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  )
}
