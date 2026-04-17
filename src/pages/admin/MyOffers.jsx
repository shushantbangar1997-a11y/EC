import React, { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FiClock, FiMapPin, FiNavigation2,
  FiCheckCircle, FiXCircle, FiInbox, FiUsers,
} from 'react-icons/fi'
import api from '../../utils/api'
import { useAdminTheme } from '../../context/AdminThemeContext'

// Status definitions — colours resolved from theme tokens at render time
const TABS = [
  { id: 'pending',  label: 'Pending',  tokenStyle: 'alt',    icon: FiClock },
  { id: 'accepted', label: 'Accepted', tokenStyle: 'strong', icon: FiCheckCircle },
  { id: 'declined', label: 'Declined', tokenStyle: 'muted',  icon: FiXCircle, strikethrough: true },
  { id: 'expired',  label: 'Expired',  tokenStyle: 'muted',  icon: FiClock },
]

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

  const refresh = async () => {
    try { const res = await api.get('/admin/my-bids'); setBids(res.data?.data || []) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh(); const id = setInterval(refresh, 5000); return () => clearInterval(id) }, [])

  const counts   = TABS.reduce((acc, t) => { acc[t.id] = bids.filter(b => (b.status || 'pending') === t.id).length; return acc }, {})
  const filtered = bids.filter(b => (b.status || 'pending') === tab)

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
          return (
            <div key={b.id} style={{
              background: T.card, borderRadius: 12, padding: 18,
              border: `1px solid ${T.border}`,
              display: 'grid', gridTemplateColumns: '1fr 110px', gap: 16,
              borderLeft: `4px solid ${st.border}`,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, padding: '2px 8px', borderRadius: 999, background: st.bg, color: st.fg }}>{status.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: 'monospace' }}>Order #{b.quote_request_id}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>· sent {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>{b.request?.name || 'Customer'}</div>
                <div style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}><FiMapPin size={11} color={T.textMuted} /> {b.request?.pickup}</div>
                <div style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}><FiNavigation2 size={11} color={T.textMuted} /> {b.request?.dropoff}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.textMuted, flexWrap: 'wrap' }}>
                  {b.request?.ride_date && <span><FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />{format(new Date(b.request.ride_date), 'MMM d, h:mm a')}</span>}
                  <span><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} />{b.request?.passengers || 1}</span>
                  <span>ETA ~{b.eta_minutes} min</span>
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
          )
        })}
      </div>
    </div>
  )
}
