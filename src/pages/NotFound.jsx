import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiPhone } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4 overflow-hidden relative">
      {/* Decorative blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-800 opacity-15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png?v=4" alt="Everywhere Cars" className="h-12 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* 404 */}
        <div className="text-9xl font-bold text-white/20 leading-none mb-2">404</div>
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-white/70 text-lg mb-10 leading-relaxed">
          Sorry, the page you're looking for doesn't exist. Let's get you back on the road.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors text-base"
          >
            <FiArrowLeft size={16} /> Back to Home
          </Link>
          <a
            href="tel:+17186586000"
            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base"
          >
            <FiPhone size={16} /> Call (718) 658-6000
          </a>
        </div>
      </div>
    </div>
  )
}

export default NotFound
