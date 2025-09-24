"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from '@/lib/i18n'

type ChatMsg = {
  id: string
  text: string
  userId: string
  userName: string
  role: string
  tenantId?: string | null
  createdAt: string
}

export default function LiveChatWidget() {
  const { t } = useTranslations()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // Load recent backlog
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/portal/chat?limit=50', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.messages)) setMessages(data.messages)
      } catch {}
    }
    if (open) void load()
    return () => { cancelled = true }
  }, [open])

  // Subscribe to realtime chat events
  useEffect(() => {
    if (!open) return
    const es = new EventSource('/api/portal/realtime?events=chat-message')
    const onMessage = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data)
        if (payload && payload.type === 'chat-message' && payload.data) {
          setMessages((prev) => [...prev, payload.data as ChatMsg])
        }
      } catch {}
    }
    es.addEventListener('open', () => setConnected(true))
    es.addEventListener('error', () => setConnected(false))
    es.addEventListener('message', onMessage)
    return () => {
      try { es.removeEventListener('message', onMessage) } catch {}
      try { es.close() } catch {}
      setConnected(false)
    }
  }, [open])

  const canSend = useMemo(() => text.trim().length > 0 && text.trim().length <= 1000, [text])

  // Flush pending queue on reconnect
  useEffect(() => {
    const onOnline = async () => {
      try {
        const raw = localStorage.getItem('af_pending_chat')
        if (!raw) return
        const items: string[] = JSON.parse(raw)
        if (!Array.isArray(items) || items.length === 0) return
        localStorage.removeItem('af_pending_chat')
        for (const msg of items) {
          try { await fetch('/api/portal/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) }) } catch {}
        }
      } catch {}
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  const send = async () => {
    const value = text.trim()
    if (!value) return
    setText('')
    // If offline, enqueue and optimistic-render
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      try {
        const pending: string[] = JSON.parse(localStorage.getItem('af_pending_chat') || '[]')
        pending.push(value)
        localStorage.setItem('af_pending_chat', JSON.stringify(pending))
      } catch {}
      const optimistic: ChatMsg = { id: Math.random().toString(36).slice(2), text: value, userId: 'me', userName: 'You', role: 'CLIENT', createdAt: new Date().toISOString(), tenantId: null }
      setMessages((prev) => [...prev, optimistic])
      return
    }
    try {
      const res = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value })
      })
      if (!res.ok) {
        console.warn('Failed to send chat message')
      }
    } catch (e) {
      console.warn('Failed to send chat message', e)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!open ? (
        <Button onClick={() => setOpen(true)} aria-label={t('portal.chat.open')} size="lg">
          {t('portal.chat.open')}
        </Button>
      ) : (
        <div className="w-80 sm:w-96 h-96 bg-white shadow-xl border rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="text-sm font-medium">{t('portal.chat.title')}</div>
            <div className={`text-xs ${connected ? 'text-green-600' : 'text-gray-500'}`}>{connected ? t('portal.chat.online') : t('portal.chat.connecting')}</div>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50" role="log" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <div className="font-medium">{m.userName} <span className="text-gray-500 text-xs">{new Date(m.createdAt).toLocaleTimeString()}</span></div>
                <div>{m.text}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-sm text-gray-500 text-center mt-6">{t('portal.chat.noMessages')}</div>
            )}
          </div>
          <div className="p-2 border-t flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSend) void send() }}
              placeholder={t('portal.chat.placeholder')}
              aria-label={t('portal.chat.inputAria')}
            />
            <Button onClick={() => void send()} disabled={!canSend}>{t('portal.chat.send')}</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
