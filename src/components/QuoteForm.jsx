import React, { useState, useEffect } from 'react'
import { FiMapPin, FiCalendar, FiUsers, FiUser, FiPhone, FiMail, FiFileText, FiCheckCircle, FiArrowRight, FiClock } from 'react-icons/fi'
import PlaceAutocomplete from './PlaceAutocomplete'
import api from '../utils/api'
import toast from 'react-hot-toast'

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan', desc: 'Up to 3 passengers' },
  { value: 'suv', label: 'SUV', desc: 'Up to 6 passengers' },
  { value: 'sprinter_van', label: 'Sprinter Van', desc: 'Up to 14 passengers' },
  { value: 'mini_bus', label: 'Mini Bus', desc: 'Up to 24 passengers' },
  { value: 'coach', label: 'Coach', desc: '25+ passengers' },
]

export default function QuoteForm({ prefillPickup = '', prefillDropoff = '' }) {
  const [pickup, setPickup] = useState(prefillPickup)
  const [dropoff, setDropoff] = useState(prefillDropoff)
  const [rideDate, setRideDate] = useState('')
  const [passengers, setPassengers] = useState('1')
  const [vehicleType, setVehicleType] = useState('sedan')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (prefillPickup) setPickup(prefillPickup)
    if (prefillDropoff) setDropoff(prefillDropoff)
  }, [prefillPickup, prefillDropoff])

  const validate = () => {
    const e = {}
    if (!pickup.trim()) e.pickup = 'Pickup location is required'
    if (!dropoff.trim()) e.dropoff = 'Dropoff location is required'
    if (!rideDate) e.rideDate = 'Date & time is required'
    if (!name.trim()) e.name = 'Your name is required'
    if (!phone.trim() && !email.trim()) e.contact = 'Phone or email is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      await api.post('/quote-requests', {
        name,
        email,
        phone,
        pickup,
        dropoff,
        ride_date: rideDate,
        passengers: Number(passengers),
        vehicle_type: vehicleType,
        notes,
      })
      setSubmitted(true)
    } catch (err) {
      toast.error('Something went wrong. Please try again or call us at (718) 658-6000.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          We'll confirm your price within <strong>15 minutes</strong> via phone or WhatsApp.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
          <FiClock size={12} />
          <span>Response time: under 15 minutes</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-5 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Your Trip</p>
          <p className="text-sm text-gray-700"><span className="font-medium">From:</span> {pickup}</p>
          <p className="text-sm text-gray-700"><span className="font-medium">To:</span> {dropoff}</p>
          <p className="text-sm text-gray-700"><span className="font-medium">Passengers:</span> {passengers}</p>
          <p className="text-sm text-gray-700"><span className="font-medium">Vehicle:</span> {VEHICLE_TYPES.find(v => v.value === vehicleType)?.label}</p>
        </div>
        <a
          href="tel:+17186586000"
          className="block w-full py-3 bg-primary-800 text-white font-bold rounded-xl hover:bg-primary-900 transition-colors text-sm"
        >
          Call Us: (718) 658-6000
        </a>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Trip Details</p>

        <div className="space-y-4">
          <div>
            <label className="label-base">Pickup Location *</label>
            <PlaceAutocomplete
              id="qf-pickup"
              name="pickup"
              value={pickup}
              onChange={setPickup}
              placeholder="Airport, hotel, address..."
              className={`input-base pl-10 ${errors.pickup ? 'input-error' : ''}`}
              icon={<FiMapPin className="w-5 h-5" />}
              required
              aria-label="Pickup location"
            />
            {errors.pickup && <p className="text-red-500 text-xs mt-1">{errors.pickup}</p>}
          </div>

          <div>
            <label className="label-base">Dropoff Location *</label>
            <PlaceAutocomplete
              id="qf-dropoff"
              name="dropoff"
              value={dropoff}
              onChange={setDropoff}
              placeholder="Destination address..."
              className={`input-base pl-10 ${errors.dropoff ? 'input-error' : ''}`}
              icon={<FiMapPin className="w-5 h-5" />}
              required
              aria-label="Dropoff location"
            />
            {errors.dropoff && <p className="text-red-500 text-xs mt-1">{errors.dropoff}</p>}
          </div>

          <div>
            <label className="label-base">Date & Time *</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#1a365d] pointer-events-none">
                <FiCalendar className="w-5 h-5" />
              </span>
              <input
                type="datetime-local"
                value={rideDate}
                onChange={e => setRideDate(e.target.value)}
                className={`input-base pl-10 ${errors.rideDate ? 'input-error' : ''}`}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            {errors.rideDate && <p className="text-red-500 text-xs mt-1">{errors.rideDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Passengers</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[#1a365d] pointer-events-none">
                  <FiUsers className="w-5 h-5" />
                </span>
                <select
                  value={passengers}
                  onChange={e => setPassengers(e.target.value)}
                  className="input-base pl-10"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
                  ))}
                  <option value="15">15+ Passengers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-base">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
                className="input-base"
              >
                {VEHICLE_TYPES.map(v => (
                  <option key={v.value} value={v.value}>{v.label} — {v.desc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Your Information</p>

        <div className="space-y-4">
          <div>
            <label className="label-base">Full Name *</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#1a365d] pointer-events-none">
                <FiUser className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                className={`input-base pl-10 ${errors.name ? 'input-error' : ''}`}
                required
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[#1a365d] pointer-events-none">
                  <FiPhone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (718) 000-0000"
                  className={`input-base pl-10 ${errors.contact ? 'input-error' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className="label-base">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[#1a365d] pointer-events-none">
                  <FiMail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`input-base pl-10 ${errors.contact ? 'input-error' : ''}`}
                />
              </div>
            </div>
          </div>
          {errors.contact && <p className="text-red-500 text-xs">{errors.contact}</p>}

          <div>
            <label className="label-base">Special Requests / Notes</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#1a365d] pointer-events-none">
                <FiFileText className="w-5 h-5" />
              </span>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Flight number, child seats, extra luggage..."
                rows={3}
                className="input-base pl-10 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-primary-900 font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
      >
        {submitting ? 'Sending...' : (
          <>Get My Free Quote <FiArrowRight size={20} /></>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        We'll confirm your price within 15 minutes. No credit card required.
      </p>
    </form>
  )
}
