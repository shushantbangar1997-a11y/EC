import React, { useEffect, useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiSearch, FiPhone, FiMail, FiMessageCircle, FiX, FiClock, FiUsers,
  FiMapPin, FiNavigation2, FiTruck, FiTrendingUp, FiAlertTriangle,
  FiCheckCircle, FiSlash, FiRefreshCw, FiInbox, FiExternalLink,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useAdminTheme } from '../../context/AdminThemeContext'

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

const STATUS_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'new',       label: 'New' },
  { id: 'quoted',    label: 'Quoted' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'lost',      label: 'Lost' },
]

function statusPill(key, T) {
  const map = {
    new:       { label: 'New',       bg: T.surfaceAlt, fg: T.textSub },
    quoted:    { label: 'Quoted',    bg: T.btnBg,      fg: T.btnText },
    confirmed: { label: 'Confirmed', bg: T.btnBg,      fg: T.btnText },
    lost:      { label: 'Lost',      bg: T.surfaceAlt, fg: T.textMuted },
  }
  return map[key] || map.new
}

function whatsappHref(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}`
}

// ── Lead detail drawer ───────────────────────────────────────────────────────
function LeadDrawer({ lead, onClose, onChanged }) {
  const { theme: T } = useAdminTheme()
  const [notes, setNotes] = useState(lead.admin_notes || '')
  const [savedNotes, setSavedNotes] = useState(lead.admin_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const saveTimerRef = useRef(null)
  // Tracks which lead is currently displayed. We compare against this inside
  // async save callbacks so a request that started for Lead A doesn't end up
  // mutating state belonging to Lead B after the user switches drawers.
  const activeLeadIdRef = useRef(lead.id)

  // Reset when switching between leads
  useEffect(() => {
    activeLeadIdRef.current = lead.id
    setNotes(lead.admin_notes || '')
    setSavedNotes(lead.admin_notes || '')
    setSavedAt(null)
    setSavingNotes(false)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
  }, [lead.id, lead.admin_notes])

  // Debounced autosave for the admin notes textarea (700ms after last keystroke)
  useEffect(() => {
    if (notes === savedNotes) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const targetLeadId = lead.id
    const targetText = notes
    saveTimerRef.current = setTimeout(async () => {
      setSavingNotes(true)
      try {
        await api.patch(`/admin/leads/${targetLeadId}/notes`, { admin_notes: targetText })
        // Drop the result if the user has since opened a different lead — the
        // current drawer state belongs to that other lead now.
        if (activeLeadIdRef.current !== targetLeadId) return
        setSavedNotes(targetText)
        setSavedAt(new Date())
        onChanged?.({ silent: true })
      } catch (err) {
        if (activeLeadIdRef.current !== targetLeadId) return
        toast.error(err.response?.data?.message || 'Could not save note')
      } finally {
        if (activeLeadIdRef.current === targetLeadId) setSavingNotes(false)
      }
    }, 700)
    return () => clearTimeout(saveTimerRef.current)
  }, [notes, savedNotes, lead.id, onChanged])

  const markLost = async () => {
    const reason = window.prompt('Reason for marking this lead as Lost? (optional)') ?? null
    if (reason === null) return
    try {
      await api.post(`/admin/leads/${lead.id}/lose`, { reason })
      toast.success('Lead marked as Lost')
      onChanged?.()
      onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update lead')
    }
  }

  const reopen = async () => {
    try {
      await api.post(`/admin/leads/${lead.id}/reopen`)
      toast.success('Lead reopened')
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reopen lead')
    }
  }

  const pill = statusPill(lead.status_key, T)
  const wa = whatsappHref(lead.phone)

  const FieldRow = ({ label, value }) => (
    <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
      <div style={{ width: 110, flexShrink: 0, fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: T.text, wordBreak: 'break-word' }}>{value || <span style={{ color: T.textMuted }}>—</span>}</div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40,
          animation: 'fadeIn 160ms ease',
        }}
      />
      {/* Drawer */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(560px, 100vw)',
        background: T.card, borderLeft: `1px solid ${T.border}`, zIndex: 41,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 220ms cubic-bezier(0.25,1.1,0.4,1)',
        boxShadow: '-12px 0 32px -16px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px 14px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, fontFamily: 'monospace', letterSpacing: 0.5 }}>LEAD #{lead.id}</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: pill.bg, color: pill.fg, letterSpacing: 0.4, textTransform: 'uppercase' }}>{pill.label}</span>
              {lead.hot && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', letterSpacing: 0.4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FiTrendingUp size={9} /> Hot
                </span>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
              {lead.name || 'Guest customer'}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
              Submitted {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
              background: 'transparent', cursor: 'pointer', color: T.textSub,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Quick actions */}
        <div style={{
          padding: '12px 20px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={actionBtn(T)}>
              <FiPhone size={12} /> Call
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} style={actionBtn(T)}>
              <FiMail size={12} /> Email
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" style={actionBtn(T)}>
              <FiMessageCircle size={12} /> WhatsApp
            </a>
          )}
          {lead.status_key !== 'lost' && lead.status_key !== 'confirmed' && (
            <button onClick={markLost} style={{ ...actionBtn(T), marginLeft: 'auto', color: T.textSub }}>
              <FiSlash size={12} /> Mark as Lost
            </button>
          )}
          {lead.status_key === 'lost' && (
            <button onClick={reopen} style={{ ...actionBtn(T), marginLeft: 'auto' }}>
              <FiRefreshCw size={12} /> Reopen
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
          {/* Profile fields */}
          <section style={{ marginBottom: 20 }}>
            <SectionLabel T={T}>Customer</SectionLabel>
            <FieldRow label="Name"  value={lead.name} />
            <FieldRow label="Email" value={lead.email} />
            <FieldRow label="Phone" value={lead.phone} />
          </section>

          <section style={{ marginBottom: 20 }}>
            <SectionLabel T={T}>Ride request</SectionLabel>
            <FieldRow label="From"        value={lead.pickup} />
            <FieldRow label="To"          value={lead.dropoff} />
            <FieldRow label="Pickup time" value={lead.ride_date ? format(new Date(lead.ride_date), 'MMM d, yyyy · h:mm a') : 'Flexible / ASAP'} />
            <FieldRow label="Passengers"  value={String(lead.passengers || 1)} />
            <FieldRow label="Vehicle"     value={VEHICLE_LABEL[lead.vehicle_type] || lead.vehicle_type} />
            <FieldRow label="Notes"       value={lead.notes ? `"${lead.notes}"` : ''} />
          </section>

          {/* Bid history */}
          <section style={{ marginBottom: 20 }}>
            <SectionLabel T={T}>Bid history ({lead.bid_count})</SectionLabel>
            {lead.bids?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {lead.bids.map(b => (
                  <div key={b.id} style={{
                    border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                        {b.operator_name || 'Operator'}
                        <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: b.status === 'accepted' ? T.text : T.textMuted }}>
                          · {b.status || 'pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                        ETA ~{b.eta_minutes ?? 30} min · {VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type}
                        {b.created_at && (
                          <> · {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</>
                        )}
                      </div>
                      {b.message && <div style={{ fontSize: 11, color: T.textSub, fontStyle: 'italic', marginTop: 2 }}>"{b.message}"</div>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: T.text }}>
                      ${b.price}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.textMuted, padding: '8px 0' }}>No bids placed yet.</div>
            )}
          </section>

          {/* Lost reason (if applicable) */}
          {lead.lost_reason && (
            <section style={{
              marginBottom: 20, padding: 12, borderRadius: 9,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                Marked as Lost
              </div>
              <div style={{ fontSize: 12, color: T.textSub, fontStyle: 'italic' }}>"{lead.lost_reason}"</div>
              {lead.lost_at && (
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                  {formatDistanceToNow(new Date(lead.lost_at), { addSuffix: true })}
                </div>
              )}
            </section>
          )}

          {/* Admin notes */}
          <section>
            <SectionLabel T={T}>
              Admin notes
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, color: T.textMuted, textTransform: 'none', letterSpacing: 0 }}>
                {savingNotes ? 'Saving…' : savedAt ? `Saved ${formatDistanceToNow(savedAt, { addSuffix: true })}` : ''}
              </span>
            </SectionLabel>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes — what did the customer say on the call? Follow-ups? Special requirements?"
              rows={6}
              maxLength={4000}
              style={{
                width: '100%', marginTop: 6, padding: '10px 12px',
                border: `1px solid ${T.inputBorder}`, borderRadius: 8,
                fontSize: 13, color: T.text, background: T.inputBg,
                outline: 'none', fontFamily: 'inherit', lineHeight: 1.45, resize: 'vertical',
              }}
            />
          </section>
        </div>
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0 }
          to   { transform: translateX(0); opacity: 1 }
        }
      `}</style>
    </>
  )
}

function SectionLabel({ T, children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: T.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
      display: 'flex', alignItems: 'center',
    }}>{children}</div>
  )
}

function actionBtn(T) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 11px', fontSize: 12, fontWeight: 600,
    background: T.surfaceAlt, color: T.text,
    border: `1px solid ${T.border}`, borderRadius: 7,
    cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit',
  }
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Leads({ forceHot = false }) {
  const { theme: T } = useAdminTheme()
  const [leads, setLeads] = useState([])
  const [counts, setCounts] = useState({ total: 0, new: 0, quoted: 0, confirmed: 0, lost: 0, hot: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const pollRef = useRef(null)

  // Reset filter when route toggles between /leads and /leads/hot
  useEffect(() => { setStatusFilter('all'); setSearch('') }, [forceHot])

  const refresh = async () => {
    try {
      const res = await api.get('/admin/leads')
      const list = res.data?.data || []
      setLeads(list)
      setCounts(res.data?.counts || {})
      // Keep the open drawer in sync if its lead changed server-side
      setSelected(prev => {
        if (!prev) return prev
        const fresh = list.find(l => l.id === prev.id)
        return fresh || prev
      })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    refresh()
    pollRef.current = setInterval(refresh, 5000)
    return () => clearInterval(pollRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply local search + status + hot filters (server already returns full set)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const isSearching = s.length > 0
    return leads.filter(l => {
      if (forceHot && !l.hot) return false
      if (statusFilter !== 'all') {
        if (l.status_key !== statusFilter) return false
      } else if (!forceHot && !isSearching) {
        // Default All view hides Lost to keep the pipeline focused — but a
        // user typing a search term still needs to find them.
        if (l.status_key === 'lost') return false
      }
      if (!isSearching) return true
      return (
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s) ||
        l.pickup?.toLowerCase().includes(s) ||
        l.dropoff?.toLowerCase().includes(s)
      )
    })
  }, [leads, search, statusFilter, forceHot])

  const heading = forceHot ? 'Hot Leads' : 'All Leads'
  const sub = forceHot
    ? 'Customers who reached out in the last 24 hours and have no offer yet — call them now.'
    : 'Every customer who has reached out. Filter, search, and follow up before they go cold.'

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: T.pageBg }}>
      <style>{`
        .leads-row:hover { background: ${T.surfaceAlt} !important; }
        .leads-row.hot   { box-shadow: inset 3px 0 0 ${T.btnBg}; }
      `}</style>

      {/* Page header */}
      <div style={{
        padding: '20px 26px 14px', borderBottom: `1px solid ${T.border}`, background: T.card,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: T.text, margin: 0, letterSpacing: -0.2 }}>{heading}</h1>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
            background: T.surfaceAlt, color: T.textSub, letterSpacing: 0.4,
          }}>{filtered.length}</span>
          <div style={{ flex: 1 }} />
          <button onClick={refresh} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', color: T.textMuted,
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500,
          }}>
            <FiRefreshCw size={11} /> Refresh
          </button>
        </div>
        <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 14px' }}>{sub}</p>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.inputBg, border: `1px solid ${T.inputBorder}`,
            borderRadius: 8, padding: '0 10px', height: 34, minWidth: 260, flex: '1 1 260px', maxWidth: 380,
          }}>
            <FiSearch size={13} color={T.textMuted} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, pickup, dropoff…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12.5, color: T.text, fontFamily: 'inherit',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0, display: 'flex' }}>
                <FiX size={12} />
              </button>
            )}
          </div>

          {!forceHot && (
            <div style={{ display: 'flex', gap: 5 }}>
              {STATUS_FILTERS.map(f => {
                const active = statusFilter === f.id
                const count = f.id === 'all' ? counts.total : counts[f.id]
                return (
                  <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{
                    padding: '6px 11px', fontSize: 12, fontWeight: 600,
                    background: active ? T.btnBg : T.surfaceAlt,
                    color: active ? T.btnText : T.textSub,
                    border: 'none', borderRadius: 999, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {f.label}
                    <span style={{
                      background: active ? T.btnText : T.border,
                      color: active ? T.btnBg : T.textSub,
                      fontSize: 10, fontWeight: 700, padding: '0 5px',
                      borderRadius: 999, minWidth: 16, textAlign: 'center',
                    }}>{count ?? 0}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: 50, textAlign: 'center', color: T.textMuted }}>
            <FiRefreshCw size={20} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: T.textMuted }}>
            <FiInbox size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>
              {forceHot ? 'No hot leads right now.' : 'No leads match these filters.'}
            </p>
            <p style={{ fontSize: 11, marginTop: 4 }}>
              {forceHot ? 'New customers in the last 24 hours with no offer yet will appear here.' : 'Try clearing the search or status filter.'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                <Th T={T}>Customer</Th>
                <Th T={T}>Contact</Th>
                <Th T={T}>From → To</Th>
                <Th T={T}>Ride date</Th>
                <Th T={T}>Vehicle</Th>
                <Th T={T}>Status</Th>
                <Th T={T} style={{ whiteSpace: 'nowrap' }}>Created</Th>
                <Th T={T} style={{ textAlign: 'right' }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const pill = statusPill(l.status_key, T)
                const wa = whatsappHref(l.phone)
                return (
                  <tr
                    key={l.id}
                    className={`leads-row${l.hot ? ' hot' : ''}`}
                    onClick={() => setSelected(l)}
                    style={{
                      borderBottom: `1px solid ${T.borderSoft}`, cursor: 'pointer',
                      transition: 'background 120ms',
                    }}
                  >
                    <Td T={T}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {l.hot && <span title="Hot lead" style={{ color: '#dc2626', display: 'flex' }}><FiTrendingUp size={12} /></span>}
                        <div>
                          <div style={{ fontWeight: 600, color: T.text }}>{l.name || 'Guest'}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, fontFamily: 'monospace' }}>#{l.id} · {l.passengers || 1} pax</div>
                        </div>
                      </div>
                    </Td>
                    <Td T={T}>
                      <div style={{ color: T.textSub, fontSize: 11.5, lineHeight: 1.4 }}>
                        {l.email && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{l.email}</div>}
                        {l.phone && <div style={{ color: T.text, fontFamily: 'monospace', fontSize: 11 }}>{l.phone}</div>}
                        {!l.email && !l.phone && <span style={{ color: T.textMuted }}>—</span>}
                      </div>
                    </Td>
                    <Td T={T}>
                      <div style={{ color: T.text, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                          <FiMapPin size={10} color={T.textMuted} />{l.pickup}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                          <FiNavigation2 size={10} color={T.textMuted} />{l.dropoff}
                        </div>
                      </div>
                    </Td>
                    <Td T={T}>
                      <div style={{ color: T.text, fontSize: 11.5, whiteSpace: 'nowrap' }}>
                        {l.ride_date ? format(new Date(l.ride_date), 'MMM d, h:mm a') : <span style={{ color: T.textMuted }}>Flexible</span>}
                      </div>
                    </Td>
                    <Td T={T}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                        background: T.surfaceAlt, color: T.textSub,
                      }}>
                        {VEHICLE_LABEL[l.vehicle_type] || l.vehicle_type}
                      </span>
                    </Td>
                    <Td T={T}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                        background: pill.bg, color: pill.fg, letterSpacing: 0.4, textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>{pill.label}</span>
                      {l.bid_count > 0 && (
                        <span style={{ marginLeft: 5, fontSize: 10, color: T.textMuted }}>{l.bid_count} bid{l.bid_count !== 1 ? 's' : ''}</span>
                      )}
                    </Td>
                    <Td T={T} style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <FiClock size={10} />
                        {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                      </span>
                    </Td>
                    <Td T={T} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        {l.phone && <IconAction href={`tel:${l.phone}`} title="Call" T={T}><FiPhone size={11} /></IconAction>}
                        {l.email && <IconAction href={`mailto:${l.email}`} title="Email" T={T}><FiMail size={11} /></IconAction>}
                        {wa && <IconAction href={wa} target="_blank" rel="noreferrer" title="WhatsApp" T={T}><FiMessageCircle size={11} /></IconAction>}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          // Silent autosaves don't need an immediate refetch — the 5s poll
          // will pick up the change. Status-changing actions (Lose/Reopen)
          // do trigger an instant refresh so the table reflects them.
          onChanged={(opts) => { if (!opts?.silent) refresh() }}
        />
      )}
    </div>
  )
}

function Th({ T, children, style }) {
  return (
    <th style={{
      textAlign: 'left', padding: '9px 14px',
      fontSize: 10, fontWeight: 700, color: T.textMuted,
      letterSpacing: 0.7, textTransform: 'uppercase',
      ...style,
    }}>{children}</th>
  )
}

function Td({ T, children, style, onClick }) {
  return (
    <td onClick={onClick} style={{ padding: '12px 14px', verticalAlign: 'middle', ...style }}>
      {children}
    </td>
  )
}

function IconAction({ href, target, rel, title, children, T }) {
  return (
    <a href={href} target={target} rel={rel} title={title} style={{
      width: 26, height: 26, borderRadius: 6,
      background: T.surfaceAlt, color: T.text,
      border: `1px solid ${T.border}`, textDecoration: 'none',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</a>
  )
}
