import React, { useEffect } from 'react'
import { FiX } from 'react-icons/fi'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative rounded-xl shadow-2xl ${sizeClasses[size]} w-full mx-4 animate-slide-in-up`}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          {title && (
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto -mr-2 -mt-2 p-2 rounded-lg transition-colors focus-visible-ring"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-field)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Close modal"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
