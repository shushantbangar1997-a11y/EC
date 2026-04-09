import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBriefcase, FiArrowRight, FiPhone } from 'react-icons/fi'

const Corporate = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f3d] via-[#1a365d] to-[#1a3a6b] flex items-center justify-center px-4">
      <div className="text-center text-white max-w-xl">
        <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-6">
          <FiBriefcase size={32} className="text-blue-200" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Corporate Travel</h1>
        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
          Streamlined business travel with dedicated account management, centralized billing, and priority booking for your team.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-[#1a365d] font-bold py-3 px-8 rounded-xl hover:bg-yellow-300 transition-colors"
          >
            Get Started <FiArrowRight />
          </button>
          <a
            href="tel:+18005551234"
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/20 transition-colors"
          >
            <FiPhone size={16} />
            (800) 555-1234
          </a>
        </div>
        <p className="mt-6 text-sm text-blue-300">Full corporate portal coming soon — contact us to set up your account today.</p>
      </div>
    </div>
  )
}

export default Corporate
