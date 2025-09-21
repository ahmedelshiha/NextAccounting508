"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RealtimeConnectionPanel() {
  const [status, setStatus] = useState<'disconnected'|'connecting'|'connected'>('disconnected')
  const [events, setEvents] = useState<string[]>(['all'])
  const wsRef = useRef<WebSocket | null>(null)

  const wsUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/api/ws/bookings?events=${encodeURIComponent(events.join(','))}`
    return url.replace(/^http/, 'ws')
  }, [events])

  useEffect(() => {
    // Connect
    setStatus('connecting')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.addEventListener('open', () => setStatus('connected'))
    ws.addEventListener('close', () => setStatus('disconnected'))
    ws.addEventListener('error', () => setStatus('disconnected'))
    ws.addEventListener('message', (e) => {
      // Simple log; in real UI we could surface last event
      try { const msg = JSON.parse(e.data); console.debug('WS event', msg) } catch {}
    })
    return () => { try { ws.close() } catch {} }
  }, [wsUrl])

  const toggleEvent = (ev: string) => {
    setEvents((prev) => {
      if (prev.includes(ev)) return prev.filter(x => x !== ev)
      return [...prev.filter(x => x !== 'all'), ev]
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime connection</CardTitle>
        <CardDescription>WebSocket connection status and subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            Status: <span className={status === 'connected' ? 'text-green-600' : status === 'connecting' ? 'text-yellow-600' : 'text-gray-600'}>{status}</span>
          </div>
          <div className="flex gap-2 text-sm">
            {['all','availability-updated','service-request-updated'].map(e => (
              <label key={e} className="flex items-center gap-1">
                <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} /> {e}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
