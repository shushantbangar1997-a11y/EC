import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiClock, FiMapPin, FiNavigation2,
  FiCheckCircle, FiXCircle, FiInbox, FiUsers,
  FiEdit2, FiTrash2, FiSend, FiDollarSign,
} from 'react-icons/fi'
import api from '../../utils/api'
import { useAdminTheme } from '../../context/AdminThemeContext'
import BidMessageThread from '../../components/BidMessageThread'

const VEHICLE_LABEL = {
  sedan: 'Sedan', suv: 'SUV', sprinter_van: 'Sprinter Van',
  mini_bus: 'Mini Bus', coach: 'Coach',
}

// Status definitions — colours resolved from theme tokens at render time
const TABS = [
  { id: 'pending',   label: 'Pending',   tokenStyle: 'alt',    icon: FiClock },
  { id: 'accepted',  label: 'Accepted',  tokenStyle: 'strong', icon: FiCheckCircle },
  { id: 'declined',  label: 'Declined',  tokenStyle: 'muted',  icon: FiXCircle, strikethrough: true },
  { id: 'withdrawn', label: 'Withdrawn', tokenStyle: 'muted',  icon: FiXCircle, strikethrough: true },
  { id: 'expired',   label: 'Expired',   tokenStyle: 'muted',  icon: FiClock },
]

// ── Inline edit form for a pending offer (price / vehicle / ETA / note) ───────
function EditOfferForm({ bid, theme: T, onSaved, onCancel }) {
  const [price, setPrice] = useState(String(bid.price ?? ''))
  const [vehicle, setVehicle] = useState(bid.vehicle_type || 'sedan')
  const [eta, setEta] = useState(bid.eta_minutes ?? 30)
  const [msg, setMsg] = useState(bid.message || bid.notes || '')
  const [busy, setBusy] = useState(false)

  const labelStyle = { fontSize: 10, fontWeight: 600, color: T.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }
  const inputStyle = { width: '100%', padding: '8px 10px', border: `1px solid ${T.inputBorder}`, borderRadius: 7, fontSize: 13, color: T.text, outline: 'none', background: T.inputBg, boxSizing: 'border-box', fontFamily: 'inherit' }

  const submit = async (e) => {
    e.preventDefault()
    const n = Number(price)
    if (!n || n <= 0) { toast.error('Enter a valid price'); return }
    setBusy(true)
    try {
      await api.patch(`/bids/${bid.id}`, {
        price: n, vehicle_type: vehicle, eta_minutes: Number(eta) || 0, message: msg,
      })
      toast.success('Offer updated')
      onSaved?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update offer')
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} style={{
      marginTop: 12, padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Price (USD)</label>
          <div style={{ position: 'relative' }}>
            <FiDollarSign size={11} style={{ position: 'absolute', left: 9, top: 11, color: T.textMuted }} />
            <input type="number" min="1" step="1" required value={price} onChange={e => setPrice(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 26, fontWeight: 700 }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Vehicle</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} style={inputStyle}>
            {Object.entries(VEHICLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>ETA (min)</label>
          <input type="number" min="0" max="240" value={eta} onChange={e => setEta(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="Optional note to customer…" maxLength={140}
          style={{ ...inputStyle, flex: 1 }} />
        <button type="button" onClick={onCancel} disabled={busy} style={{
          padding: '8px 14px', background: 'transparent', color: T.textSub,
          border: `1px solid ${T.border}`, borderRadius: 7, fontWeight: 600, fontSize: 12,
          cursor: 'pointer',
        }}>Cancel</button>
        <button type="submit" disabled={busy || !price} style={{
          padding: '8px 14px',
          background: busy || !price ? T.btnDisBg : T.btnBg,
          color: busy || !price ? T.btnDisText : T.btnText,
          border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12,
          cursor: busy || !price ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <FiSend size={11} />
          {busy ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function resolveTabStyle(tab, T) {
  if (tab.tokenStyle === 'strong') return { bg: T.btnBg, fg: T.btnText, border: T.btnBg }
  if (tab.tokenStyle === 'muted')  return { bg: T.surfaceAlt, fg: T.textMuted, border: T.border }
  return { bg: T.surfaceAlt, fg: T.textSub, border: T.border }
}

export default function MyOffers() {
  const { theme: T } = useAdminTheme()
  const [bids,    setBids]    = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('pending')
  const [editingId, setEditingId] = useState(null)
  const [withdrawingId, setWithdrawingId] = useState(null)

  const refresh = async () => {
    try { const res = await api.get('/admin/my-bids'); setBids(res.data?.data || []) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh(); const id = setInterval(refresh, 5000); return () => clearInterval(id) }, [])

  const handleWithdraw = async (bid) => {
    if (!window.confirm('Withdraw this offer? The customer will no longer see it.')) return
    setWithdrawingId(bid.id)
    try {
      await api.post(`/bids/${bid.id}/withdraw`)
      toast.success('Offer withdrawn')
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw')
    } finally { setWithdrawingId(null) }
  }

  const counts   = TABS.reduce((acc, t) => { acc[t.id] = bids.filter(b => (b.status || 'pending') === t.id).length; return acc }, {})
  // Sort by most recently active (updated_at) so live conversations bubble up
  const filtered = bids
    .filter(b => (b.status || 'pending') === tab)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: T.pageBg }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: -0.3 }}>My Offers</h1>
        <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Every bid you've sent and how the customer responded.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const st     = resolveTabStyle(t, T)
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 13px', fontSize: 12, fontWeight: 600,
              background: active ? T.btnBg : T.card,
              color: active ? T.btnText : T.textSub,
              border: `1px solid ${active ? T.btnBg : T.border}`,
              borderRadius: 9, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.2,
            }}>
              <t.icon size={12} />
              {t.label}
              <span style={{ background: active ? T.btnText : T.surfaceAlt, color: active ? T.btnBg : T.textMuted, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>{counts[t.id] || 0}</span>
            </button>
          )
        })}
      </div>

      {loading && <div style={{ color: T.textMuted, fontSize: 13 }}>Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ background: T.card, borderRadius: 12, padding: 56, textAlign: 'center', color: T.textMuted, border: `1px solid ${T.border}` }}>
          <FiInbox size={34} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600, color: T.textSub }}>No {tab} offers</p>
          <p style={{ fontSize: 12, marginTop: 5 }}>Bids you've sent will show up here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(b => {
          const status = TABS.find(t => t.id === (b.status || 'pending')) || TABS[0]
          const st     = resolveTabStyle(status, T)
          const isPending = (b.status || 'pending') === 'pending'
          const isEditing = editingId === b.id
          const wasEdited = b.updated_at && b.updated_at !== b.created_at
          return (
            <div key={b.id} style={{
              background: T.card, borderRadius: 12, padding: 18,
              border: `1px solid ${T.border}`,
              borderLeft: `4px solid ${st.border}`,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, padding: '2px 8px', borderRadius: 999, background: st.bg, color: st.fg }}>{status.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: 'monospace' }}>Order #{b.quote_request_id}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>· sent {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</span>
                    {wasEdited && (
                      <span style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>
                        · updated {formatDistanceToNow(new Date(b.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>{b.request?.name || 'Customer'}</div>
                  <div style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}><FiMapPin size={11} color={T.textMuted} /> {b.request?.pickup}</div>
                  <div style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}><FiNavigation2 size={11} color={T.textMuted} /> {b.request?.dropoff}</div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.textMuted, flexWrap: 'wrap' }}>
                    {b.request?.ride_date && <span><FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />{format(new Date(b.request.ride_date), 'MMM d, h:mm a')}</span>}
                    <span><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} />{b.request?.passengers || 1}</span>
                    <span>{VEHICLE_LABEL[b.vehicle_type] || b.vehicle_type} · ETA ~{b.eta_minutes} min</span>
                  </div>
                  {b.message && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: T.surfaceAlt, borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, color: T.textSub, fontStyle: 'italic' }}>"{b.message}"</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Your Price</div>
                  <div style={{
                    fontSize: 28, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, marginTop: 4,
                    color: status.strikethrough ? T.textMuted : T.text,
                    textDecoration: status.strikethrough ? 'line-through' : 'none',
                  }}>${b.price}</div>
                  {b.status === 'accepted' && (
                    <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <FiCheckCircle size={11} /> Confirmed
                    </div>
                  )}
                </div>
              </div>

              {/* Action row — pending offers can be edited or withdrawn */}
              {isPending && !isEditing && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setEditingId(b.id)} style={{
                    padding: '7px 12px', background: T.btnBg, color: T.btnText,
                    border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <FiEdit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleWithdraw(b)} disabled={withdrawingId === b.id} style={{
                    padding: '7px 12px', background: 'transparent', color: T.textSub,
                    border: `1px solid ${T.border}`, borderRadius: 7, fontWeight: 600, fontSize: 12,
                    cursor: withdrawingId === b.id ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <FiTrash2 size={11} /> {withdrawingId === b.id ? 'Withdrawing…' : 'Withdraw'}
                  </button>
                </div>
              )}

              {isEditing && (
                <EditOfferForm
                  bid={b}
                  theme={T}
                  onSaved={() => { setEditingId(null); refresh() }}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {/* Per-bid message thread (always available — even on accepted bids) */}
              <BidMessageThread
                bidId={b.id}
                viewerKind="operator"
                pollMs={5000}
                theme={T}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
