import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays(anchorDate) {
  const d = new Date(anchorDate)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return day
  })
}

function generateTimeSlots() {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const ampm = h < 12 ? 'AM' : 'PM'
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      slots.push({ label: `${h12}:${mm} ${ampm}`, value: `${hh}:${mm}` })
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function RideDatePicker({ initialDate, initialTime, minDate, onConfirm, onClose }) {
  const today = minDate ? new Date(minDate + 'T00:00:00') : new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = initialDate ? new Date(initialDate + 'T00:00:00') : new Date()
  const [anchor, setAnchor] = useState(startDate)
  const [selectedDay, setSelectedDay] = useState(startDate < today ? today : startDate)
  const [selectedTime, setSelectedTime] = useState(initialTime || '09:00')
  const timeRef = useRef(null)

  const weekDays = getWeekDays(anchor)
  const monthLabel = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function changeWeek(dir) {
    const n = new Date(anchor)
    n.setDate(n.getDate() + (dir === 'next' ? 7 : -7))
    setAnchor(n)
  }

  function handleConfirm() {
    onConfirm(toDateStr(selectedDay), selectedTime)
  }

  useEffect(() => {
    if (timeRef.current) {
      const idx = TIME_SLOTS.findIndex(s => s.value === selectedTime)
      const btn = timeRef.current.children[idx]
      if (btn) btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  const prevWeekDisabled = weekDays[weekDays.length - 1] < today

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full sm:max-w-sm mx-auto rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: 'var(--border-field)' }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Pick Date & Time
            </h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
              style={{ background: 'var(--bg-field)', color: 'var(--text-secondary)' }}
            >
              <FiX size={15} />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {monthLabel}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeWeek('prev')}
                  disabled={prevWeekDisabled}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors disabled:opacity-30"
                  style={{ background: 'var(--bg-field)', color: 'var(--text-secondary)' }}
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  onClick={() => changeWeek('next')}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                  style={{ background: 'var(--bg-field)', color: 'var(--text-secondary)' }}
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => {
                const isPast = day < today
                const isSelected = isSameDay(day, selectedDay)
                const isToday = isSameDay(day, new Date())
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {DAY_LABELS[i]}
                    </span>
                    <div className="relative">
                      <button
                        disabled={isPast}
                        onClick={() => setSelectedDay(day)}
                        className="relative w-9 h-9 rounded-xl text-sm font-semibold transition-colors disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center"
                        style={{
                          color: isSelected ? '#000' : isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
                          background: isSelected ? 'transparent' : 'transparent',
                          zIndex: 1,
                        }}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              layoutId="day-selector"
                              className="absolute inset-0 rounded-xl"
                              style={{ background: 'var(--text-primary)', zIndex: 0 }}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            />
                          )}
                        </AnimatePresence>
                        <span style={{ position: 'relative', zIndex: 1, color: isSelected ? 'var(--bg-surface)' : undefined }}>
                          {day.getDate()}
                        </span>
                      </button>
                      {isToday && !isSelected && (
                        <span
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: 'var(--text-primary)' }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-5">
            <span
              className="text-xs font-mono font-bold tracking-widest block mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              TIME — New York (ET)
            </span>
            <div
              ref={timeRef}
              className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {TIME_SLOTS.map((slot) => {
                const isSel = selectedTime === slot.value
                return (
                  <button
                    key={slot.value}
                    onClick={() => setSelectedTime(slot.value)}
                    className="relative text-xs font-medium py-2 rounded-lg transition-colors"
                    style={{
                      background: isSel ? 'var(--text-primary)' : 'var(--bg-field)',
                      color: isSel ? 'var(--bg-surface)' : 'var(--text-secondary)',
                      border: isSel ? 'none' : '1px solid transparent',
                    }}
                  >
                    {slot.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--bg-field-hover)' }}>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--bg-field)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)' }}
            >
              Confirm
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
