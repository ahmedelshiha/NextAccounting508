"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

export type AdminRealtimeEvent<T = any> = {
  type: string
  data: T
  userId?: string
  timestamp: string
}

type EventHandler = (event: AdminRealtimeEvent) => void

interface RealtimeContextValue {
  connected: boolean
  lastEvent: AdminRealtimeEvent | null
  subscribeByTypes: (types: string[], handler: EventHandler) => () => void
}

const RealtimeCtx = createContext<RealtimeContextValue | null>(null)

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
    const es = new EventSource(`/api/admin/realtime?events=${encodeURIComponent(events.join(","))}`)
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as AdminRealtimeEvent
        if (parsed && parsed.type) deliver(parsed)
      } catch {
        // ignore non-JSON keep-alives
      }
    }

    return () => {
      try { es.close() } catch {}
      esRef.current = null
      setConnected(false)
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
