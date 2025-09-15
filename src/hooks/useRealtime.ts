'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export interface RealtimeEvent<T = any> {
  type: string
  data: T
  userId?: string
  timestamp: string
}

export function useRealtime(eventTypes: string[] = ['all']) {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const qs = encodeURIComponent(eventTypes.join(','))
    const es = new EventSource(`/api/admin/realtime?events=${qs}`)

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
    return () => {
      es.close()
      setConnected(false)
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
