'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

export type ClientNotification = {
  id: string
  message: string
  href?: string
  createdAt: string
  read: boolean
}

function buildMessage(evt: any): { message: string; href?: string } | null {
  if (!evt || !evt.type) return null
  if (evt.type === 'service-request-updated') {
    const srId = evt.data?.serviceRequestId
    const status = evt.data?.status
    const commentId = evt.data?.commentId
    if (commentId) {
      return { message: 'New comment on your service request', href: srId ? `/portal/service-requests/${srId}` : undefined }
    }
    if (status) {
      return { message: `Your service request status is now ${String(status).replace('_',' ')}`, href: srId ? `/portal/service-requests/${srId}` : undefined }
    }
    return srId ? { message: 'Your service request was updated', href: `/portal/service-requests/${srId}` } : null
  }
  if (evt.type === 'team-assignment') {
    const srId = evt.data?.serviceRequestId
    return srId ? { message: 'Your request has been assigned to a specialist', href: `/portal/service-requests/${srId}` } : null
  }
  return null
}

export function useClientNotifications() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ClientNotification[]>([])
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!session?.user) return

    const es = new EventSource('/api/portal/realtime?events=service-request-updated,team-assignment')
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        const info = buildMessage(payload)
        if (!info) return
        const idPart = payload?.data?.serviceRequestId || Math.random().toString(36).slice(2)
        const nid = `${payload.type}:${idPart}:${payload?.data?.status || payload?.data?.commentId || ''}:${payload.timestamp}`
        setItems((prev) => {
          if (prev.some((x) => x.id === nid)) return prev
          return [
            { id: nid, message: info.message, href: info.href, createdAt: payload.timestamp || new Date().toISOString(), read: false },
            ...prev
          ].slice(0, 50)
        })
      } catch {
        // ignore parse errors
      }
    }
    es.onerror = () => {
      // best-effort retry handled by browser; if closed, we drop reference
    }

    esRef.current = es

    // Clear notifications and close ES on global logout
    const onLogout = () => {
      try { es.close() } catch {}
      esRef.current = null
      setItems([])
    }
    window?.addEventListener?.('app:logout', onLogout)

    return () => { try { es.close() } catch {} ; esRef.current = null; window?.removeEventListener?.('app:logout', onLogout) }
  }, [session?.user])

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])

  const markAllRead = () => setItems((prev) => prev.map((x) => ({ ...x, read: true })))
  const markRead = (id: string) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)))
  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id))

  return { notifications: items, unreadCount, markAllRead, markRead, remove }
}
