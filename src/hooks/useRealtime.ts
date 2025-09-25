'use client'

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export interface RealtimeEvent<T = any> {
  type: string
  data: T
  userId?: string
  timestamp: string
}

const ES_SET = new Set<EventSource>()

export function disconnectRealtimeClients() {
  for (const es of Array.from(ES_SET)) {
    try { es.close() } catch {}
    ES_SET.delete(es)
  }
}

export function useRealtime(eventTypes: string[] = ['all']) {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | WebSocket | null>(null)

  useEffect(() => {
    const qs = encodeURIComponent(eventTypes.join(','))

    // Try WebSocket first; fallback to SSE
    let ws: WebSocket | null = null
    try {
      const url = (typeof window !== 'undefined' && window.location.origin) ? `${window.location.origin}/api/ws/bookings?events=${qs}` : `/api/ws/bookings?events=${qs}`
      ws = new WebSocket(url.replace(/^http/, 'ws'))
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)
      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data) as RealtimeEvent
          setEvents((prev) => [...prev.slice(-99), parsed])
        } catch {}
      }
      esRef.current = ws
      return () => { try { ws?.close() } catch {} }
    } catch (e) {
      // WebSocket failed — fallback to SSE
      const es = new EventSource(`/api/portal/realtime?events=${qs}`)

      es.onopen = () => setConnected(true)
      es.onerror = () => setConnected(false)
      es.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data) as RealtimeEvent
          setEvents((prev) => [...prev.slice(-99), parsed])
        } catch {
          // ignore
        }
      }

      esRef.current = es
      ES_SET.add(es)

      return () => {
        try { es.close() } catch {}
        ES_SET.delete(es)
        setConnected(false)
      }
    }
  }, [eventTypes.join(',')])

  const helpers = useMemo(() => ({
    getEventsByType: (type: string) => events.filter((e) => e.type === type),
    getLatestEvent: (type: string) => {
      const filtered = events.filter((e) => e.type === type)
      return filtered[filtered.length - 1] ?? null
    },
  }), [events])

  return { events, connected, ...helpers }
}
