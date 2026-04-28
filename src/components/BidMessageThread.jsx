import React, { useCallback, useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FiSend, FiMessageSquare, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import api from '../utils/api'

// Reusable per-bid message thread.
// Used by both the admin My Offers page and the customer live-bids panel.
//
// Props:
//   bidId         — id of the bid this thread belongs to
//   quoteToken    — guest customers send this so the server lets them through
//   viewerKind    — 'operator' | 'customer'  (controls bubble alignment & label)
//   pollMs        — poll cadence (default 5000)
//   theme         — optional admin theme tokens; falls back to neutral grey palette
//   defaultOpen   — start expanded
//   compact       — slimmer padding for embedding inside cards
export default function BidMessageThread({
  bidId,
  quoteToken,
  viewerKind = 'operator',
  pollMs = 5000,
  theme,
  defaultOpen = false,
  compact = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const pollRef = useRef(null)
  const scrollRef = useRef(null)

  const T = theme || {
    text: '#0a0a0a', textSub: '#525252', textMuted: '#737373',
    surfaceAlt: '#f5f5f5', card: '#ffffff', border: '#e5e5e5',
    inputBg: '#ffffff', inputBorder: '#d4d4d4',
    btnBg: '#0a0a0a', btnText: '#ffffff', btnDisBg: '#e5e5e5', btnDisText: '#a3a3a3',
  }

  const params = quoteToken ? { token: quoteToken } : undefined

  const fetchMessages = useCallback(async () => {
    if (!bidId) return
    try {
      const res = await api.get(`/bids/${bidId}/messages`, { params })
      const list = res.data?.data || []
      setMessages(prev => {
        // Avoid unnecessary re-renders if nothing changed
        if (prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id) {
          return prev
        }
        return list
      })
      setLoaded(true)
    } catch {
      setLoaded(true)
    }
  }, [bidId, quoteToken])

  // Always fetch once on mount (and any time the bid id changes) so the
  // collapsed header can show an accurate count and last-message preview.
  // While open, poll at the configured cadence.
  useEffect(() => {
    if (!bidId) return
    fetchMessages()
    if (open) {
      pollRef.current = setInterval(fetchMessages, pollMs)
      return () => clearInterval(pollRef.current)
    }
  }, [bidId, open, fetchMessages, pollMs])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const send = async (e) => {
    e?.preventDefault?.()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    try {
      const payload = quoteToken ? { body, quote_token: quoteToken } : { body }
      const res = await api.post(`/bids/${bidId}/messages`, payload)
      const msg = res.data?.data
      if (msg) setMessages(prev => [...prev, msg])
      setDraft('')
    } catch (err) {
      // surface inline; let caller toast if they want richer behavior
      console.warn('[BidMessageThread] send failed', err.response?.data || err.message)
    } finally {
      setSending(false)
    }
  }

  const lastMessage = messages[messages.length - 1]
  const pad = compact ? '8px 10px' : '10px 12px'

  return (
    <div style={{
      marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10,
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          color: T.textSub, fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
        }}
      >
        <FiMessageSquare size={12} />
        {messages.length > 0 ? `Messages (${messages.length})` : 'Messages'}
        {open ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        {!open && lastMessage && (
          <span style={{
            marginLeft: 8, fontSize: 11, color: T.textMuted, fontWeight: 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
          }}>
            {lastMessage.sender_name}: "{lastMessage.body}"
          </span>
        )}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          <div
            ref={scrollRef}
            style={{
              maxHeight: 220, overflowY: 'auto',
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
            }}
          >
            {!loaded && <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: 8 }}>Loading…</div>}
            {loaded && messages.length === 0 && (
              <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: 8 }}>
                No messages yet. Start the conversation below.
              </div>
            )}
            {messages.map(m => {
              const mine = m.sender_kind === viewerKind
              return (
                <div key={m.id} style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: mine ? T.btnBg : T.card,
                  color: mine ? T.btnText : T.text,
                  border: mine ? 'none' : `1px solid ${T.border}`,
                  borderRadius: 9, padding: pad, fontSize: 12, lineHeight: 1.35,
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
                    opacity: 0.8, marginBottom: 3,
                  }}>
                    {mine ? 'You' : m.sender_name}
                    <span style={{ marginLeft: 6, fontWeight: 400, opacity: 0.7 }}>
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                </div>
              )
            })}
          </div>

          <form onSubmit={send} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Type a message…"
              maxLength={1000}
              style={{
                flex: 1, padding: '8px 10px',
                border: `1px solid ${T.inputBorder}`, borderRadius: 7,
                fontSize: 12, color: T.text, background: T.inputBg,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              style={{
                padding: '8px 12px',
                background: sending || !draft.trim() ? T.btnDisBg : T.btnBg,
                color: sending || !draft.trim() ? T.btnDisText : T.btnText,
                border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12,
                cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <FiSend size={11} />
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
