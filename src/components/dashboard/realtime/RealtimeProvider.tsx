"use client"

/**
 * RealtimeProvider establishes a Server-Sent Events (SSE) connection to
 * /api/admin/realtime and exposes a lightweight pub/sub API. Consumers may
 * subscribe to specific event types (or "all") and will be notified when
 * matching AdminRealtimeEvent messages arrive. The provider also posts
 * connection telemetry to /api/admin/perf-metrics for observability.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

export type AdminRealtimeEvent<T = any> = {
  type: string
  data: T
  userId?: string
  timestamp: string
}

type EventHandler = (event: AdminRealtimeEvent) => void

/**
 * Safely parse a Server-Sent Event message payload.
 * Returns a typed AdminRealtimeEvent when valid, otherwise null.
 */
export function parseEventMessage(raw: string): AdminRealtimeEvent | null {
  try {
    const parsed = JSON.parse(raw) as AdminRealtimeEvent
    if (parsed && typeof parsed === 'object' && typeof (parsed as any).type === 'string' && (parsed as any).type.length > 0) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

interface RealtimeContextValue {
  /** True when the SSE connection is open */
  connected: boolean
  /** The last event delivered by the SSE stream (null before first message) */
  lastEvent: AdminRealtimeEvent | null
  /** Subscribe to one or more event types; returns an unsubscribe function */
  subscribeByTypes: (types: string[], handler: EventHandler) => () => void
}

export const RealtimeCtx = createContext<RealtimeContextValue | null>(null)

interface RealtimeProviderProps {
  /** Event types to request from the server (default: ["all"]) */
  events?: string[]
  children: ReactNode
}

export function RealtimeProvider({ events = ["all"], children }: RealtimeProviderProps) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<AdminRealtimeEvent | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const listenersRef = useRef<Array<{ types: Set<string>; handler: EventHandler }>>([])

  // Helper to deliver events to registered listeners by type
  const deliver = (evt: AdminRealtimeEvent) => {
    setLastEvent(evt)
    for (const sub of listenersRef.current) {
      if (sub.types.has("all") || sub.types.has(evt.type)) {
        try { sub.handler(evt) } catch { /** swallow handler errors */ }
      }
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const start = Date.now()
    let retries = 0
    const post = (payload: any) => {
      try {
        const body = JSON.stringify({
          ts: Date.now(),
          path: 'admin-realtime',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr',
          type: 'realtime-telemetry',
          ...payload,
        })
        const url = '/api/admin/perf-metrics'
        if ('sendBeacon' in navigator) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
        else fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body }).catch(() => {})
      } catch {}
    }

    const requested = Array.from(new Set((events && events.length ? events : ['all']).filter(Boolean)))
    const queryTypes = requested.includes('all') ? ['all'] : requested
    const query = queryTypes.length ? `?events=${encodeURIComponent(queryTypes.join(','))}` : ''
    const es = new EventSource(`/api/admin/realtime${query}`)
    esRef.current = es

    const handleNamed = (type: string) => (e: MessageEvent) => {
      const parsed = typeof e.data === 'string' ? parseEventMessage(e.data) : null
      if (parsed) {
        deliver(parsed)
        return
      }
      let data: any = e.data
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch {}
      }
      deliver({ type, data, timestamp: new Date().toISOString() })
    }

    es.onopen = () => {
      setConnected(true)
      post({ path: 'admin-realtime', connected: true, retries, connectMs: Date.now() - start })
    }
    es.onerror = () => {
      setConnected(false)
      retries += 1
      post({ path: 'admin-realtime', connected: false, retries })
    }

    const baselineEvents = new Set<string>(['message', 'ready', 'heartbeat', 'booking_update', 'task_completed', 'system_alert'])
    for (const evt of queryTypes) {
      if (evt && evt !== 'all') baselineEvents.add(evt)
    }

    es.onmessage = handleNamed('message')
    for (const evt of baselineEvents) {
      if (evt === 'message') continue
      es.addEventListener(evt, handleNamed(evt))
    }

    return () => {
      try { es.close() } catch {}
      esRef.current = null
      setConnected(false)
      post({ path: 'admin-realtime', closed: true })
    }
  }, [events.join(",")])

  const value = useMemo<RealtimeContextValue>(() => ({
    connected,
    lastEvent,
    subscribeByTypes: (types: string[], handler: EventHandler) => {
      const entry = { types: new Set(types && types.length ? types : ["all"]), handler }
      listenersRef.current.push(entry)
      return () => {
        const idx = listenersRef.current.indexOf(entry)
        if (idx >= 0) listenersRef.current.splice(idx, 1)
      }
    }
  }), [connected, lastEvent])

  return <RealtimeCtx.Provider value={value}>{children}</RealtimeCtx.Provider>
}

export function useAdminRealtime() {
  const ctx = useContext(RealtimeCtx)
  if (!ctx) throw new Error("useAdminRealtime must be used within RealtimeProvider")
  return ctx
}
