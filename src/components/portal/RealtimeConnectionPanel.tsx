"use client"

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'

export default function RealtimeConnectionPanel() {
  const { t } = useTranslations()
  const [status, setStatus] = useState<'disconnected'|'connecting'|'connected'>('disconnected')
  const [events, setEvents] = useState<string[]>(['all'])
  const wsRef = useRef<WebSocket | null>(null)

  const wsUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/api/ws/bookings?events=${encodeURIComponent(events.join(','))}`
    return url.replace(/^http/, 'ws')
  }, [events])

  useEffect(() => {
    let es: EventSource | null = null
    // Connect: try WebSocket first, fallback to SSE
    setStatus('connecting')
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.addEventListener('open', () => setStatus('connected'))
      ws.addEventListener('close', () => setStatus('disconnected'))
      ws.addEventListener('error', () => {
        setStatus('disconnected')
        try { ws.close() } catch {}
        // fallback to SSE
        try {
          es = new EventSource(`/api/portal/realtime?events=${encodeURIComponent(events.join(','))}`)
          es.addEventListener('open', () => setStatus('connected'))
          es.addEventListener('error', () => setStatus('disconnected'))
          es.addEventListener('message', (e) => { try { const msg = JSON.parse(e.data); console.debug('SSE event', msg) } catch {} })
          wsRef.current = null
        } catch (e) {
          // ignore
        }
      })
      ws.addEventListener('message', (e) => {
        try { const msg = JSON.parse(e.data); console.debug('WS event', msg) } catch {}
      })
    } catch (e) {
      // WebSocket failed — fallback to SSE
      try {
        es = new EventSource(`/api/portal/realtime?events=${encodeURIComponent(events.join(','))}`)
        es.addEventListener('open', () => setStatus('connected'))
        es.addEventListener('error', () => setStatus('disconnected'))
        es.addEventListener('message', (e) => { try { const msg = JSON.parse(e.data); console.debug('SSE event', msg) } catch {} })
        wsRef.current = null
      } catch (e) {
        setStatus('disconnected')
      }
    }

    return () => {
      try { if (wsRef.current instanceof WebSocket) (wsRef.current as WebSocket).close() } catch {}
      try { if (es) es.close() } catch {}
    }
  }, [wsUrl, events])

  const toggleEvent = (ev: string) => {
    setEvents((prev) => {
      if (prev.includes(ev)) return prev.filter(x => x !== ev)
      return [...prev.filter(x => x !== 'all'), ev]
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('portal.realtime.title')}</CardTitle>
        <CardDescription>{t('portal.realtime.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{t('portal.realtime.statusLabel')} </span>
            <span aria-live="polite" className={status === 'connected' ? 'text-green-600' : status === 'connecting' ? 'text-yellow-600' : 'text-gray-600'}>{t(`portal.realtime.status.${status}`)}</span>
          </div>
          <div className="flex gap-2 text-sm" role="group" aria-label={t('portal.realtime.eventsGroup')}>
            {['all','availability-updated','service-request-updated'].map(e => (
              <label key={e} className="flex items-center gap-1">
                <input aria-label={t(`portal.realtime.event.${e}`)} type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} /> {t(`portal.realtime.event.${e}`)}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
