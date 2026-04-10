import React, { useState, useEffect } from 'react'
import { FiMessageCircle } from 'react-icons/fi'

const WHATSAPP_URL = 'https://wa.me/17182196683'

export default function WhatsAppWidget() {
  const [hovered, setHovered] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const initialHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      setKeyboardOpen(currentHeight < initialHeight * 0.75)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (keyboardOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {hovered && (
        <span className="bg-white text-gray-800 font-semibold text-sm px-4 py-2 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap animate-fade-in">
          Chat with us
        </span>
      )}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          animation: 'whatsapp-pulse 2.5s ease-in-out infinite',
        }}
      >
        <FiMessageCircle size={26} className="text-white" />
      </a>

      <style>{`
        @keyframes whatsapp-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5), 0 4px 20px rgba(37, 211, 102, 0.3); }
          50% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0), 0 4px 20px rgba(37, 211, 102, 0.3); }
        }
      `}</style>
    </div>
  )
}
