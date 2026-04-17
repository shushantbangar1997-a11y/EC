import React from 'react'
import { Link } from 'react-router-dom'
import {
  FiMapPin,
  FiCheckCircle,
  FiAward,
  FiArrowRight,
  FiCheck,
  FiPhone,
  FiShield,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi'

const STEPS = [
  {
    step: '01',
    icon: FiMapPin,
    title: 'Tell Us Where You\'re Going',
    description:
      'Enter your pickup address, destination, travel date, and passenger count. It takes less than 60 seconds.',
  },
  {
    step: '02',
    icon: FiCheckCircle,
    title: 'We Send You a Fixed Price',
    description:
      'Our reservations team reviews your request and sends you a fixed, all-inclusive price — no hidden fees, no surge pricing.',
  },
  {
    step: '03',
    icon: FiAward,
    title: 'Confirm & Ride in Comfort',
    description:
      'Approve your quote, pay securely, and a professional chauffeur will meet you at your door. Flight tracking included on all airport transfers.',
  },
]

const BENEFITS = [
  { icon: FiClock, label: 'Free 60-minute airport wait — we track your flight' },
  { icon: FiDollarSign, label: 'Fixed all-inclusive pricing — no surprises at journey\'s end' },
  { icon: FiShield, label: 'Fully licensed, insured, and background-checked chauffeurs' },
  { icon: FiPhone, label: '24 / 7 live support before, during, and after every ride' },
  { icon: FiCheck, label: 'No payment required until you confirm your booking' },
  { icon: FiAward, label: 'Premium fleet — sedans, SUVs, Sprinters, and coach buses' },
]

const HowItWorks = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', transition: 'background 300ms ease' }}>

      {/* Hero */}
      <section className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-800 opacity-15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-white/80">
            Simple &amp; Transparent
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            How It Works
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Booking a premium chauffeur with Everywhere Cars is fast, simple, and completely transparent — from your first request to the moment you arrive.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#1a365d] mb-2 block">Three Easy Steps</span>
            <h2 className="text-4xl font-bold text-gray-900">From Request to Ride</h2>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {STEPS.map((item, idx, arr) => (
              <React.Fragment key={item.step}>
                <div className="relative bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-8 text-center group flex-1">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a365d] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider">
                    STEP {item.step}
                  </div>
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mx-auto mb-5 mt-2 group-hover:bg-[#1a365d] transition-colors duration-300">
                    <item.icon className="text-[#1a365d] group-hover:text-white transition-colors duration-300" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.description}</p>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-2 flex-shrink-0 text-[#1a365d] opacity-40">
                    <FiArrowRight size={28} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#1a365d] mb-2 block">Every Ride, Every Time</span>
            <h2 className="text-4xl font-bold text-gray-900">What's Included</h2>
            <p className="text-gray-500 text-base mt-3 max-w-xl mx-auto">Every booking comes with the same premium experience — no upgrades required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BENEFITS.map((b, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-center w-10 h-10 bg-[#1a365d] rounded-xl flex-shrink-0">
                  <b.icon className="text-white" size={18} />
                </div>
                <span className="text-gray-700 font-medium text-sm">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Book Your Ride?</h2>
          <p className="text-white/70 text-lg mb-10">
            Join thousands of travellers who trust Everywhere Cars for premium, stress-free ground transportation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors text-base"
            >
              Get a Free Quote <FiArrowRight />
            </Link>
            <a
              href="tel:+17186586000"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              <FiPhone size={16} /> Call (718) 658-6000
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowItWorks
