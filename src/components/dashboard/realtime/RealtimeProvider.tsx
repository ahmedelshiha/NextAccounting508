"use client"

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
  connected: boolean
  lastEvent: AdminRealtimeEvent | null
  subscribeByTypes: (types: string[], handler: EventHandler) => () => void
}

export const RealtimeCtx = createContext<RealtimeContextValue | null>(null)

interface RealtimeProviderProps {
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
    // Establish SSE connection in browser only
    if (typeof window === "undefined") return

    const start = Date.now()
    let retries = 0
    const post = (payload: any) => {
      try {
        const body = JSON.stringify({ type: 'realtime', ...payload })
        const url = '/api/admin/perf-metrics'
        if ('sendBeacon' in navigator) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
        else fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body }).catch(() => {})
      } catch {}
    }

    const es = new EventSource(`/api/admin/realtime?events=${encodeURIComponent(events.join(","))}`)
    esRef.current = es

    es.onopen = () => {
      setConnected(true)
      post({ path: 'admin-realtime', connected: true, retries, connectMs: Date.now() - start })
    }
    es.onerror = () => {
      setConnected(false)
      retries += 1
      post({ path: 'admin-realtime', connected: false, retries })
    }
    es.onmessage = (e) => {
      const evt = parseEventMessage(e.data)
      if (evt) deliver(evt)
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
