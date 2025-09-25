'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type RealtimeEvent = { type: string; data: any; timestamp?: string }

export default function useBookingsSocket(opts?: { events?: string[] }) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const wsRef = useRef<WebSocket | EventSource | null>(null)

  const connectWS = useCallback(() => {
    try {
      const url = (typeof window !== 'undefined' && window.location.origin) ? `${window.location.origin}/api/ws/bookings` : `/api/ws/bookings`
      const ws = new WebSocket(url.replace(/^http/, 'ws'))
      wsRef.current = ws
      ws.onopen = () => setConnected(true)
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data)
          setLastEvent(payload)
        } catch {}
      }
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)

      // Send initial subscribe message if events specified
      if (opts?.events && opts.events.length) {
        ws.addEventListener('open', () => {
          try { ws.send(JSON.stringify({ type: 'subscribe', events: opts.events })) } catch {}
        })
      }
    } catch (e) {
      // fallback to SSE
      connectSSE()
    }
  }, [opts?.events])

  const connectSSE = useCallback(() => {
    try {
      const url = '/api/portal/realtime?events=' + (opts?.events?.join(',') || 'all')
      const es = new EventSource(url)
      wsRef.current = es
      setConnected(true)
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data)
          setLastEvent(payload)
        } catch {}
      }
      es.onerror = () => {
        setConnected(false)
        try { es.close() } catch {}
      }
    } catch (e) {
      setConnected(false)
    }
  }, [opts?.events])

  useEffect(() => {
    // Try WebSocket first, fallback to SSE
    connectWS()
    return () => {
      if (wsRef.current instanceof EventSource) {
        try { wsRef.current.close() } catch {}
      } else if (wsRef.current instanceof WebSocket) {
        try { wsRef.current.close() } catch {}
      }
    }
  }, [connectWS, connectSSE])

  const send = useCallback((payload: any) => {
    try {
      if (wsRef.current instanceof WebSocket && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload))
        return true
      }
    } catch {}
    return false
  }, [])

  return { connected, lastEvent, send }
}
