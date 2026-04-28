import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import {
  FiSend, FiPaperclip, FiUser, FiCircle, FiSlash, FiSearch, FiImage,
  FiCheck, FiPlay,
} from 'react-icons/fi'
import { useAdminTheme } from '../../context/AdminThemeContext'

function fmtTime(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

function fmtRelative(iso) {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function LiveChat() {
  const { theme: T } = useAdminTheme()
  const [sessions, setSessions] = useState([])     // [{id, session_id, name, email, online, page_url, last_seen, last_message_preview, ...}]
  const [activeKey, setActiveKey] = useState(null) // session_id (visitor key)
  const [messagesByKey, setMessagesByKey] = useState({}) // { [session_id]: Message[] }
  const [draft, setDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('online')   // online | all
  const [search, setSearch] = useState('')
  const [visitorTyping, setVisitorTyping] = useState({}) // { [session_id]: timestamp }
  const [error, setError] = useState('')

  const socketRef = useRef(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const composerRef = useRef(null)
  const typingEmitRef = useRef(0)

  // ── Connect once ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] })
    socketRef.current = socket

    const sayHello = () => socket.emit('admin:hello', { token })
    socket.on('connect', sayHello)

    socket.on('chat:snapshot', ({ sessions: list }) => {
      setSessions(Array.isArray(list) ? list : [])
    })

    socket.on('chat:session-update', (s) => {
      setSessions(prev => {
        const idx = prev.findIndex(x => x.session_id === s.session_id)
        if (idx === -1) return [s, ...prev]
        const next = prev.slice()
        next[idx] = { ...prev[idx], ...s }
        return next
      })
    })

    socket.on('chat:message-preview', ({ session_id, message }) => {
      // Bump the row's preview/last_seen so the list reorders even if we
      // haven't joined that session's room yet.
      setSessions(prev => {
        const idx = prev.findIndex(x => x.session_id === session_id)
        if (idx === -1) return prev
        const updated = {
          ...prev[idx],
          last_message_preview: message.image_url ? '📷 Image' : message.body,
          last_message_kind: message.sender_kind,
          last_seen: message.created_at,
        }
        const next = prev.slice()
        next.splice(idx, 1)
        return [updated, ...next]
      })
    })

    socket.on('chat:transcript', ({ session_id, messages }) => {
      setMessagesByKey(prev => ({ ...prev, [session_id]: messages || [] }))
    })

    socket.on('chat:message', (msg) => {
      setMessagesByKey(prev => {
        const list = prev[msg.session_id] || []
        if (list.some(m => m.id === msg.id)) return prev
        return { ...prev, [msg.session_id]: [...list, msg] }
      })
    })

    socket.on('chat:typing', ({ kind, is_typing, session_id }) => {
      if (kind !== 'visitor') return
      setVisitorTyping(prev => ({ ...prev, [session_id]: is_typing ? Date.now() : 0 }))
    })

    socket.on('chat:ended', ({ session_id }) => {
      setSessions(prev => prev.map(s => s.session_id === session_id ? { ...s, status: 'ended' } : s))
    })

    // Read-receipt deltas: server stamps `read_at` on the matching messages.
    socket.on('chat:read', ({ session_id, message_ids, read_at }) => {
      const set = new Set(message_ids || [])
      setMessagesByKey(prev => {
        const list = prev[session_id]
        if (!list) return prev
        const next = list.map(m => set.has(m.id) ? { ...m, read_at } : m)
        return { ...prev, [session_id]: next }
      })
    })

    socket.on('chat:auth-error', (e) => setError(e.message || 'Auth failed'))

    return () => socket.disconnect()
  }, [])

  // ── Join a session room when active changes; also mark visitor messages
  //    as read so the visitor sees double-checks immediately. ──────────────
  useEffect(() => {
    if (!activeKey) return
    const sock = socketRef.current
    sock?.emit('admin:join-session', { session_id: activeKey })
    sock?.emit('admin:mark-read', { session_id: activeKey })
  }, [activeKey])

  // Also mark-read whenever new visitor messages arrive in the active thread.
  useEffect(() => {
    if (!activeKey) return
    const list = messagesByKey[activeKey] || []
    const hasUnreadVisitor = list.some(m => m.sender_kind === 'visitor' && !m.read_at)
    if (hasUnreadVisitor) {
      socketRef.current?.emit('admin:mark-read', { session_id: activeKey })
    }
  }, [messagesByKey, activeKey])

  // ── Auto-scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messagesByKey, activeKey])

  // ── Stale-typing cleanup tick ────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setVisitorTyping(prev => {
        const now = Date.now()
        const next = {}
        let changed = false
        for (const [k, ts] of Object.entries(prev)) {
          if (ts && now - ts < 4000) next[k] = ts
          else if (ts) changed = true
        }
        return changed ? next : prev
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const activeSession = useMemo(
    () => sessions.find(s => s.session_id === activeKey) || null,
    [sessions, activeKey]
  )
  const activeMessages = activeKey ? (messagesByKey[activeKey] || []) : []

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sessions
      .filter(s => filter === 'all' ? true : s.online)
      .filter(s => {
        if (!q) return true
        return (
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.page_url || '').toLowerCase().includes(q) ||
          (s.last_message_preview || '').toLowerCase().includes(q)
        )
      })
  }, [sessions, filter, search])

  const onlineCount = sessions.filter(s => s.online).length

  // ── Sending ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback((overrides = {}) => {
    if (!activeKey) return
    const body = (overrides.body ?? draft).trim()
    const image_url = overrides.image_url || ''
    if (!body && !image_url) return
    socketRef.current?.emit('admin:message', {
      session_id: activeKey,
      body,
      image_url,
      visitor_name: activeSession?.name || '',
      page_url: activeSession?.page_url || '',
    })
    if (!overrides.image_url) setDraft('')
  }, [activeKey, draft, activeSession])

  const handleTyping = (e) => {
    setDraft(e.target.value)
    if (!activeKey) return
    const now = Date.now()
    if (now - typingEmitRef.current > 1500) {
      typingEmitRef.current = now
      socketRef.current?.emit('admin:typing', { session_id: activeKey, is_typing: true })
      setTimeout(() => socketRef.current?.emit('admin:typing', { session_id: activeKey, is_typing: false }), 2000)
    }
  }

  const uploadAndSend = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Only image files are supported'); return }
    if (file.size > 5 * 1024 * 1024)     { setError('Image must be 5 MB or smaller'); return }
    if (!activeKey)                       { setError('Pick a visitor first'); return }
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('session_id', activeKey)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload failed')
      sendMessage({ body: '', image_url: data.url })
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) uploadAndSend(file)
  }

  const handlePaste = (e) => {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
    if (item) {
      const file = item.getAsFile()
      if (file) uploadAndSend(file)
    }
  }

  const endSession = () => {
    if (!activeKey) return
    if (!window.confirm('End this chat? The visitor will see a notice that you closed the conversation.')) return
    socketRef.current?.emit('admin:end-session', { session_id: activeKey })
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: T.pageBg }}>
      {/* ── Visitor list ────────────────────────────────────────────────── */}
      <aside style={{
        width: 320, minWidth: 320, borderRight: `1px solid ${T.border}`,
        background: T.surface, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Live Chat</h2>
            <span style={{
              fontSize: 11, color: T.textSub, padding: '2px 8px',
              background: T.surfaceAlt, borderRadius: 999, fontWeight: 600,
            }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: 999,
                background: '#22c55e', marginRight: 5, verticalAlign: 1,
              }} />
              {onlineCount} online
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '6px 10px',
          }}>
            <FiSearch size={13} color={T.textSub} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitors…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12.5, color: T.text,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {['online', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                  border: `1px solid ${T.border}`,
                  background: filter === f ? T.btnBg : 'transparent',
                  color: filter === f ? T.btnText : T.textSub,
                  borderRadius: 6, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {f === 'online' ? 'Active now' : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredSessions.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: T.textSub, fontSize: 12 }}>
              {filter === 'online' ? 'No visitors online right now.' : 'No chat sessions yet.'}
            </div>
          )}
          {filteredSessions.map(s => {
            const isActive = s.session_id === activeKey
            const isTyping = !!visitorTyping[s.session_id]
            return (
              <button
                key={s.session_id}
                onClick={() => setActiveKey(s.session_id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '11px 14px', borderBottom: `1px solid ${T.border}`,
                  background: isActive ? T.surfaceAlt : 'transparent',
                  borderLeft: isActive ? `3px solid ${T.btnBg}` : '3px solid transparent',
                  cursor: 'pointer', display: 'flex', gap: 10,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 999,
                  background: T.surfaceAlt, border: `1px solid ${T.border}`,
                  color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, flexShrink: 0, position: 'relative',
                }}>
                  {(s.name || 'V').slice(0, 1).toUpperCase()}
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: 999,
                    background: s.online ? '#22c55e' : '#9ca3af',
                    border: `2px solid ${isActive ? T.surfaceAlt : T.surface}`,
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: T.text,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {s.name || 'Anonymous visitor'}
                    </div>
                    <div style={{ fontSize: 10, color: T.textSub, flexShrink: 0 }}>
                      {fmtRelative(s.last_seen)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, color: T.textSub, marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {isTyping
                      ? <span style={{ color: '#22c55e', fontStyle: 'italic' }}>typing…</span>
                      : (s.last_message_preview || (s.page_url ? `On ${s.page_url}` : 'New visitor'))}
                  </div>
                  {s.email && (
                    <div style={{
                      fontSize: 10, color: T.textSub, marginTop: 1, opacity: 0.7,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {s.email}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Conversation pane ───────────────────────────────────────────── */}
      <section
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        onDragOver={(e) => { e.preventDefault() }}
        onDrop={handleDrop}
      >
        {!activeSession ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: T.textSub,
            gap: 8, padding: 40, textAlign: 'center',
          }}>
            <FiUser size={32} />
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
              Pick a visitor to start chatting
            </div>
            <div style={{ fontSize: 12 }}>
              {onlineCount > 0
                ? `${onlineCount} visitor${onlineCount === 1 ? ' is' : 's are'} on the site right now.`
                : 'No visitors online — waiting for someone to land on the site.'}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
              background: T.surface, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 999,
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, position: 'relative',
              }}>
                {(activeSession.name || 'V').slice(0, 1).toUpperCase()}
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 11, height: 11, borderRadius: 999,
                  background: activeSession.online ? '#22c55e' : '#9ca3af',
                  border: `2px solid ${T.surface}`,
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>
                  {activeSession.name || 'Anonymous visitor'}
                  {activeSession.email && (
                    <span style={{ fontWeight: 400, color: T.textSub, marginLeft: 8, fontSize: 12 }}>
                      · {activeSession.email}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 1, display: 'flex', gap: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiCircle size={7} fill={activeSession.online ? '#22c55e' : '#9ca3af'} stroke="none" />
                    {activeSession.online ? 'Online now' : `Last seen ${fmtRelative(activeSession.last_seen)}`}
                  </span>
                  {activeSession.page_url && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Viewing: <span style={{ color: T.text }}>{activeSession.page_url}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={endSession}
                disabled={activeSession.status === 'ended'}
                title="End conversation"
                style={{
                  border: `1px solid ${T.border}`, background: 'transparent',
                  color: T.textSub, fontSize: 11, fontWeight: 600,
                  padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: activeSession.status === 'ended' ? 0.5 : 1,
                }}
              >
                <FiSlash size={11} />
                {activeSession.status === 'ended' ? 'Ended' : 'End chat'}
              </button>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '16px 18px',
              background: T.pageBg, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {activeMessages.length === 0 && (
                <div style={{
                  margin: 'auto', padding: 28, textAlign: 'center',
                  color: T.textSub, fontSize: 12,
                  border: `1px dashed ${T.border}`, borderRadius: 12,
                  maxWidth: 380, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 14,
                }}>
                  <div>
                    No messages yet. Greet
                    <strong style={{ color: T.text }}> {activeSession.name || 'this visitor'} </strong>
                    to start the conversation.
                  </div>
                  <button
                    onClick={() => sendMessage({
                      body: `Hi${activeSession.name ? ` ${activeSession.name.split(' ')[0]}` : ''}! Welcome to Everywhere Cars — how can I help you today?`,
                    })}
                    disabled={activeSession.status === 'ended'}
                    style={{
                      background: T.btnBg, color: T.btnText, border: 'none',
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                      fontSize: 12.5, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 6,
                      opacity: activeSession.status === 'ended' ? 0.4 : 1,
                    }}
                  >
                    <FiPlay size={11} /> Start Chat
                  </button>
                </div>
              )}
              {activeMessages.map(m => {
                const mine = m.sender_kind === 'admin'
                return (
                  <div key={m.id} style={{
                    display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '70%', display: 'flex', flexDirection: 'column',
                      alignItems: mine ? 'flex-end' : 'flex-start', gap: 2,
                    }}>
                      {!mine && (
                        <div style={{ fontSize: 10, color: T.textSub, paddingLeft: 6 }}>
                          {m.sender_name || activeSession.name || 'Visitor'}
                        </div>
                      )}
                      <div style={{
                        background: mine ? T.btnBg : T.surface,
                        color: mine ? T.btnText : T.text,
                        border: mine ? 'none' : `1px solid ${T.border}`,
                        padding: '8px 11px', borderRadius: 12,
                        borderBottomRightRadius: mine ? 4 : 12,
                        borderBottomLeftRadius: mine ? 12 : 4,
                        fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word',
                      }}>
                        {m.image_url && (
                          <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={m.image_url}
                              alt="Attachment"
                              style={{
                                maxWidth: 240, maxHeight: 200, borderRadius: 8,
                                marginBottom: m.body ? 6 : 0, display: 'block',
                                border: `1px solid ${T.border}`,
                              }}
                            />
                          </a>
                        )}
                        {m.body && <div>{m.body}</div>}
                      </div>
                      <div style={{
                        fontSize: 10, color: T.textSub,
                        paddingLeft: mine ? 0 : 6, paddingRight: mine ? 6 : 0,
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <span>{fmtTime(m.created_at)}</span>
                        {!mine && m.read_at && (
                          <span title={`Read ${fmtTime(m.read_at)}`} style={{
                            display: 'inline-flex', alignItems: 'center',
                            color: '#22c55e', marginLeft: 2,
                          }}>
                            <FiCheck size={10} style={{ marginRight: -5 }} />
                            <FiCheck size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {visitorTyping[activeKey] && (
                <div style={{ fontSize: 11, color: T.textSub, fontStyle: 'italic', paddingLeft: 6 }}>
                  {activeSession.name || 'Visitor'} is typing…
                </div>
              )}
            </div>

            {/* Composer */}
            <div style={{
              borderTop: `1px solid ${T.border}`, background: T.surface,
              padding: 10,
            }}>
              {error && (
                <div style={{
                  padding: '6px 10px', marginBottom: 8,
                  background: '#fee2e2', color: '#991b1b',
                  borderRadius: 6, fontSize: 11.5,
                }}>
                  {error}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => uploadAndSend(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 6,
                border: `1px solid ${T.border}`, borderRadius: 10,
                padding: 6, background: T.surfaceAlt,
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || activeSession.status === 'ended'}
                  title="Attach image (or drag & drop, or paste)"
                  style={{
                    background: 'transparent', border: 'none', color: T.textSub,
                    cursor: 'pointer', padding: 6, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: (uploading || activeSession.status === 'ended') ? 0.4 : 1,
                  }}
                >
                  <FiPaperclip size={16} />
                </button>
                <textarea
                  ref={composerRef}
                  value={draft}
                  onChange={handleTyping}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={
                    activeSession.status === 'ended'
                      ? 'This conversation has ended.'
                      : uploading ? 'Uploading image…'
                      : activeMessages.length === 0
                        ? `Send the first message to ${activeSession.name || 'this visitor'}…`
                        : 'Type a reply… (Shift+Enter for newline)'
                  }
                  rows={1}
                  disabled={uploading || activeSession.status === 'ended'}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    outline: 'none', resize: 'none', color: T.text,
                    fontSize: 13, lineHeight: 1.4, padding: '6px 4px',
                    maxHeight: 120, fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={(!draft.trim() && !uploading) || activeSession.status === 'ended'}
                  style={{
                    background: T.btnBg, color: T.btnText, border: 'none',
                    width: 34, height: 34, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: ((!draft.trim() && !uploading) || activeSession.status === 'ended') ? 0.4 : 1,
                    flexShrink: 0,
                  }}
                  title="Send (Enter)"
                >
                  {activeMessages.length === 0 ? <FiSend size={13} /> : <FiSend size={13} />}
                </button>
              </div>
              <div style={{ fontSize: 10, color: T.textSub, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiImage size={10} /> Drag &amp; drop or paste an image to send · 5 MB max
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
