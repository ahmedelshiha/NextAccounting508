import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

export type AdminNotification = {
  id: string
  message: string
  href?: string
  createdAt: string
  read: boolean
}

function buildAdminMessage(evt: any): { message: string; href?: string } | null {
  if (!evt || !evt.type) return null
  if (evt.type === 'service-request-updated') {
    const srId = evt.data?.serviceRequestId
    const action = evt.data?.action
    const status = evt.data?.status
    if (status) return { message: `Service request ${String(srId || '')} status: ${String(status).replace('_',' ')}`, href: srId ? `/admin/service-requests/${srId}` : undefined }
    if (action === 'created') return { message: `New service request ${srId ? `#${srId}` : ''} created`, href: srId ? `/admin/service-requests/${srId}` : undefined }
    return srId ? { message: `Service request ${srId} updated`, href: `/admin/service-requests/${srId}` } : { message: 'Service request updated' }
  }
  if (evt.type === 'task-updated') {
    const taskId = evt.data?.taskId
    const srId = evt.data?.serviceRequestId
    return { message: `Task ${taskId ? `#${taskId}` : ''} updated${srId ? ` (SR #${srId})` : ''}`, href: srId ? `/admin/service-requests/${srId}` : '/admin/tasks' }
  }
  if (evt.type === 'team-assignment') {
    const srId = evt.data?.serviceRequestId
    const assignee = evt.data?.assigneeName || 'Team member'
    return { message: `Assigned ${assignee} to request${srId ? ` #${srId}` : ''}`, href: srId ? `/admin/service-requests/${srId}` : '/admin/service-requests' }
  }
  return null
}

export function useAdminNotifications() {
  const { data: session } = useSession()
  const [items, setItems] = useState<AdminNotification[]>([])
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!session?.user) return

    const es = new EventSource('/api/admin/realtime?events=service-request-updated,task-updated,team-assignment')
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        const info = buildAdminMessage(payload)
        if (!info) return
        const key = `${payload.type}:${payload?.data?.serviceRequestId || payload?.data?.taskId || ''}:${payload?.data?.status || payload?.data?.action || ''}:${payload.timestamp}`
        setItems(prev => {
          if (prev.some(x => x.id === key)) return prev
          return [
            { id: key, message: info.message, href: info.href, createdAt: payload.timestamp || new Date().toISOString(), read: false },
            ...prev
          ].slice(0, 50)
        })
      } catch {
        // ignore
      }
    }
    es.onerror = () => { try { es.close() } catch {} }
    esRef.current = es
    return () => { try { es.close() } catch {}; esRef.current = null }
  }, [session?.user])

  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items])
  const markAllRead = () => setItems(prev => prev.map(x => ({ ...x, read: true })))
  const markRead = (id: string) => setItems(prev => prev.map(x => (x.id === id ? { ...x, read: true } : x)))
  const remove = (id: string) => setItems(prev => prev.filter(x => x.id !== id))

  return { notifications: items, unreadCount, markAllRead, markRead, remove }
}
