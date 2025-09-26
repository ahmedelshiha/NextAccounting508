"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ChatMsg = {
  id: string
  text: string
  userId: string
  userName: string
  role: string
  tenantId?: string | null
  createdAt: string
}

export function MessageCenter() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

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
    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
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
  }, [])

  const canSend = useMemo(() => text.trim().length > 0 && text.trim().length <= 1000, [text])

  const send = async () => {
    const value = text.trim()
    if (!value) return
    setText('')
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
      await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value })
      })
    } catch {}
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Message Center</CardTitle>
          <CardDescription className="text-xs">Chat securely with our team. Real-time updates enabled.</CardDescription>
        </div>
        <div className={`text-xs ${connected ? 'text-green-600' : 'text-gray-500'}`}>{connected ? 'Online' : 'Connecting…'}</div>
      </CardHeader>
      <CardContent>
        <div ref={listRef} className="h-72 overflow-y-auto bg-gray-50 rounded-md p-3 space-y-2" role="log" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className="text-sm">
              <div className="font-medium">{m.userName} <span className="text-gray-500 text-xs">{new Date(m.createdAt).toLocaleTimeString()}</span></div>
              <div>{m.text}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-gray-500 text-center mt-6">No messages yet.</div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSend) void send() }}
            placeholder="Type your message…"
            aria-label="Type your message"
          />
          <Button onClick={() => void send()} disabled={!canSend}>Send</Button>
        </div>
      </CardContent>
    </Card>
  )
}
