import React, { useState, useEffect } from 'react'
import { FiPhone, FiMail, FiMapPin, FiUsers, FiClock, FiRefreshCw, FiMessageCircle } from 'react-icons/fi'
import { format } from 'date-fns'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  new: 'bg-orange-100 text-orange-700 border-orange-200',
  contacted: 'bg-blue-100 text-blue-700 border-blue-200',
  booked: 'bg-green-100 text-green-700 border-green-200',
}

const VEHICLE_LABELS = {
  sedan: 'Sedan',
  suv: 'SUV',
  sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus',
  coach: 'Coach',
}

export default function QuoteRequestsTab() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await api.get('/quote-requests')
      const sorted = (res.data.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setLeads(sorted)
    } catch (err) {
      toast.error('Failed to load quote requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const updateStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      await api.patch(`/quote-requests/${id}/status`, { status })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      toast.success(`Status updated to "${status}"`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <FiRefreshCw size={24} className="animate-spin mr-2" />
        Loading quote requests...
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <FiMessageCircle size={40} className="mx-auto mb-4 opacity-40" />
        <p className="font-medium">No quote requests yet</p>
        <p className="text-sm mt-1">They'll appear here when customers submit the public quote form.</p>
        <button onClick={fetchLeads} className="mt-4 text-blue-600 hover:underline text-sm flex items-center gap-1 mx-auto">
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>
    )
  }

  const newCount = leads.filter(l => l.status === 'new').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quote Requests</h2>
          {newCount > 0 && (
            <p className="text-sm text-orange-600 font-medium mt-1">
              {newCount} new {newCount === 1 ? 'lead' : 'leads'} need attention
            </p>
          )}
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="space-y-4">
        {leads.map(lead => (
          <div
            key={lead.id}
            className={`bg-white rounded-xl border-2 p-5 transition-shadow hover:shadow-md ${
              lead.status === 'new' ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="font-bold text-gray-900 text-lg">{lead.name}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                    {lead.status}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FiClock size={11} />
                    {format(new Date(lead.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600 mb-3">
                  <div className="flex items-start gap-2">
                    <FiMapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-700">From:</span> {lead.pickup}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiMapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-700">To:</span> {lead.dropoff}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiUsers size={14} className="text-gray-400 flex-shrink-0" />
                    <span><span className="font-medium text-gray-700">Passengers:</span> {lead.passengers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock size={14} className="text-gray-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-700">Date:</span>{' '}
                      {lead.ride_date ? format(new Date(lead.ride_date), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 text-primary-700 font-semibold hover:underline"
                    >
                      <FiPhone size={13} /> {lead.phone}
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-green-600 font-semibold hover:underline"
                    >
                      <FiMessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline"
                    >
                      <FiMail size={13} /> {lead.email}
                    </a>
                  )}
                  <span className="text-gray-500">
                    {VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}
                  </span>
                </div>

                {lead.notes && (
                  <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic">
                    "{lead.notes}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                {lead.status === 'new' && (
                  <button
                    onClick={() => updateStatus(lead.id, 'contacted')}
                    disabled={updatingId === lead.id}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Mark Contacted
                  </button>
                )}
                {lead.status === 'contacted' && (
                  <button
                    onClick={() => updateStatus(lead.id, 'booked')}
                    disabled={updatingId === lead.id}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Mark Booked
                  </button>
                )}
                {lead.status === 'booked' && (
                  <span className="px-4 py-2 text-green-700 font-semibold text-sm text-center">✓ Booked</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
