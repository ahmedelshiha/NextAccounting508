'use client'

import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Notification = { id: string; type: string; message: string; taskId?: string }

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/admin/tasks/updates')
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications)
          }
        } catch (e) { console.debug('parse sse', e) }
      }
      es.onerror = () => {
        es?.close()
      }
    } catch (e) { console.debug('sse failed', e) }
    return () => es?.close()
  }, [])

  return (
    <div className="relative">
      <Button size="sm" variant={open ? 'default' : 'ghost'} onClick={() => setOpen((s) => !s)}>
        <Bell className="h-4 w-4 mr-1" />
        <span className="text-xs">Notifications</span>
        {notifications.length > 0 && <span className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-[10px] px-1 rounded">{notifications.length}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow p-2 z-50">
          {notifications.length === 0 ? (
            <div className="text-sm text-gray-500 p-2">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="border-b last:border-b-0 p-2">
                <div className="text-sm font-medium">{n.message}</div>
                <div className="text-xs text-gray-500">{n.type}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
