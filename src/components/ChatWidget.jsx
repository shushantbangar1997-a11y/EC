import React, { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { FiMessageSquare, FiX, FiSend, FiPaperclip } from 'react-icons/fi'

const STORAGE_KEY = 'ec_chat_session_id'
const TOKEN_KEY   = 'ec_chat_token'
const NAME_KEY    = 'ec_chat_name'
const EMAIL_KEY   = 'ec_chat_email'
const OPEN_KEY    = 'ec_chat_open'

function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) === '1')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '')
  const [needsIdentity, setNeedsIdentity] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')

  const socketRef = useRef(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const adminTypingTimeoutRef = useRef(null)
  const typingEmitRef = useRef(0)

  // Refs that mirror state — used inside socket listeners to avoid stale
  // closures (the listeners are registered once on mount).
  const openRef = useRef(open)
  const sessionIdRef = useRef(localStorage.getItem(STORAGE_KEY) || '')
  const chatTokenRef = useRef(localStorage.getItem(TOKEN_KEY) || '')
  useEffect(() => { openRef.current = open }, [open])

  // Decide whether the visitor is logged in (we'll piggyback the JWT
  // so the chat session links to the customer record automatically).
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // ── Connect socket once on mount ─────────────────────────────────────────
  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    const sayHello = () => {
      socket.emit('visitor:hello', {
        chat_token: chatTokenRef.current || undefined,
        token: localStorage.getItem('token') || undefined,
        name: localStorage.getItem(NAME_KEY) || undefined,
        email: localStorage.getItem(EMAIL_KEY) || undefined,
        page_url: window.location.pathname,
      })
    }

    socket.on('connect', () => {
      setConnected(true)
      setError('')
      sayHello()
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setError('Connecting…'))

    // Server tells us our (possibly server-issued) session_id + signed token.
    // We persist both so the next reconnect proves ownership.
    socket.on('chat:identity', ({ session_id, chat_token }) => {
      if (session_id) {
        sessionIdRef.current = session_id
        localStorage.setItem(STORAGE_KEY, session_id)
      }
      if (chat_token) {
        chatTokenRef.current = chat_token
        localStorage.setItem(TOKEN_KEY, chat_token)
      }
    })

    socket.on('chat:hello', ({ messages: msgs }) => {
      setMessages(Array.isArray(msgs) ? msgs : [])
    })

    socket.on('chat:message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Use the ref so we don't trip on a stale `open` captured at mount.
      if (msg.sender_kind === 'admin' && !openRef.current) {
        setUnread(u => u + 1)
      }
    })

    socket.on('chat:typing', (payload) => {
      if (payload.kind !== 'admin') return
      setAdminTyping(!!payload.is_typing)
      clearTimeout(adminTypingTimeoutRef.current)
      if (payload.is_typing) {
        adminTypingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 4000)
      }
    })

    socket.on('chat:ended', ({ reason } = {}) => {
      setMessages(prev => [...prev, {
        id: `sys_${Date.now()}`,
        sender_kind: 'system',
        body: reason === 'offline_timeout'
          ? 'This conversation was archived after 5 minutes of inactivity. Send a new message to start a fresh chat.'
          : 'The agent ended this conversation.',
        created_at: new Date().toISOString(),
      }])
    })

    // Read-receipt deltas — flip the visitor's outbound bubbles to "Read".
    socket.on('chat:read', ({ message_ids, read_at }) => {
      const set = new Set(message_ids || [])
      setMessages(prev => prev.map(m => set.has(m.id) ? { ...m, read_at } : m))
    })

    return () => {
      clearTimeout(adminTypingTimeoutRef.current)
      socket.disconnect()
    }
  }, [])

  // ── Heartbeat every 10s with the current page url ───────────────────────
  useEffect(() => {
    const send = () => {
      socketRef.current?.emit('visitor:heartbeat', { page_url: window.location.pathname })
    }
    const id = setInterval(send, 10000)
    return () => clearInterval(id)
  }, [])

  // ── Persist open/closed state and clear unread on open ──────────────────
  useEffect(() => {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0')
    if (open) setUnread(0)
  }, [open])

  // ── Auto-scroll on new messages ─────────────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, adminTyping, open])

  // ── Identity prompt: required for guests before first message ───────────
  useEffect(() => {
    if (token) { setNeedsIdentity(false); return }
    setNeedsIdentity(!name)
  }, [name, token])

  const sendMessage = useCallback(async (overrides = {}) => {
    const body = (overrides.body ?? draft).trim()
    const image_url = overrides.image_url || ''
    if (!body && !image_url) return
    if (!token && !name) {
      setNeedsIdentity(true)
      return
    }
    socketRef.current?.emit('visitor:message', {
      body, image_url, name: name || undefined,
    })
    if (!overrides.image_url) setDraft('')
  }, [draft, name, token])

  const handleTyping = (e) => {
    setDraft(e.target.value)
    const now = Date.now()
    if (now - typingEmitRef.current > 1500) {
      typingEmitRef.current = now
      socketRef.current?.emit('visitor:typing', { is_typing: true })
      setTimeout(() => socketRef.current?.emit('visitor:typing', { is_typing: false }), 2000)
    }
  }

  const handleAttach = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Only image files are supported'); return }
    if (file.size > 5 * 1024 * 1024)     { setError('Image must be 5 MB or smaller'); return }
    if (!token && !name) { setNeedsIdentity(true); return }
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('session_id', sessionIdRef.current)
      fd.append('chat_token', chatTokenRef.current)
      const res = await fetch('/api/chat/upload', { method: 'POST', body: fd })
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

  const submitIdentity = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    localStorage.setItem(NAME_KEY, name.trim())
    if (email.trim()) localStorage.setItem(EMAIL_KEY, email.trim())
    socketRef.current?.emit('visitor:hello', {
      chat_token: chatTokenRef.current || undefined,
      token: localStorage.getItem('token') || undefined,
      name: name.trim(),
      email: email.trim() || undefined,
      page_url: window.location.pathname,
    })
    setNeedsIdentity(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating bubble — sits above the WhatsApp button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="fixed right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gray-300 bg-black text-white"
        style={{ bottom: 92 }}
      >
        {open ? <FiX size={22} /> : <FiMessageSquare size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center border-2 border-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{
            bottom: 168,
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(560px, calc(100vh - 200px))',
          }}
        >
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Everywhere Cars Support</div>
              <div className="text-[11px] text-gray-300 flex items-center gap-1.5">
                {(() => {
                  // Three distinct states so the visitor isn't left guessing:
                  //   1. Socket not yet connected → grey
                  //   2. Connected but no admin has spoken in this session yet
                  //      AND visitor has already sent something → yellow "Connecting you to an agent…"
                  //   3. Otherwise (idle or admin has replied) → green
                  const visitorSent = messages.some(m => m.sender_kind === 'visitor')
                  const adminSpoke  = messages.some(m => m.sender_kind === 'admin')
                  if (!connected) {
                    return (<><span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500" />Connecting…</>)
                  }
                  if (visitorSent && !adminSpoke) {
                    return (<><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Connecting you to an agent…</>)
                  }
                  return (<><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />Online — usually replies in minutes</>)
                })()}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-gray-300 hover:text-white p-1"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Identity capture (guests only, first time) */}
          {needsIdentity ? (
            <form onSubmit={submitIdentity} className="flex-1 flex flex-col p-5 gap-3 overflow-y-auto">
              <p className="text-sm text-gray-700 leading-relaxed">
                Hi! Tell us who we're chatting with so we can follow up if we get
                disconnected.
              </p>
              <input
                type="text"
                placeholder="Your name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                className="bg-black text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Start chat
              </button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-gray-500 py-6">
                    Send us a message — we usually reply within a few minutes.
                  </div>
                )}
                {messages.map((m) => {
                  const mine = m.sender_kind === 'visitor'
                  const sys  = m.sender_kind === 'system'
                  if (sys) {
                    return (
                      <div key={m.id} className="text-center text-[11px] text-gray-500 italic py-1">
                        {m.body}
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        {!mine && (
                          <div className="text-[10px] text-gray-500 mb-0.5 px-1">
                            {m.sender_name || 'Agent'}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm break-words ${
                            mine
                              ? 'bg-black text-white rounded-br-sm'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          {m.image_url && (
                            <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={m.image_url}
                                alt="Attachment"
                                className="rounded-lg mb-1 max-h-48 w-auto object-cover border border-gray-100"
                              />
                            </a>
                          )}
                          {m.body && <div>{m.body}</div>}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 px-1 flex items-center gap-1">
                          <span>{formatTime(m.created_at)}</span>
                          {mine && (
                            <span title={m.read_at ? 'Read' : 'Sent'} className={m.read_at ? 'text-green-500' : 'text-gray-400'}>
                              {m.read_at ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {adminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-xs text-gray-500 italic">
                      Agent is typing…
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-gray-200 bg-white">
                {error && (
                  <div className="px-3 py-1.5 bg-red-50 text-red-700 text-xs border-b border-red-100">
                    {error}
                  </div>
                )}
                <div className="flex items-end gap-2 p-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAttach(e.target.files?.[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach image"
                    disabled={uploading}
                    className="text-gray-500 hover:text-black p-2 disabled:opacity-50"
                  >
                    <FiPaperclip size={18} />
                  </button>
                  <textarea
                    placeholder={uploading ? 'Uploading image…' : 'Type a message…'}
                    value={draft}
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    rows={1}
                    disabled={uploading}
                    className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black max-h-24"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={(!draft.trim() && !uploading) || uploading}
                    className="bg-black text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-40 hover:bg-gray-800 transition-colors flex-shrink-0"
                    aria-label="Send message"
                  >
                    <FiSend size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
