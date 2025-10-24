"use client"

import React from 'react'
import OfflineQueueInspector from '@/components/portal/OfflineQueueInspector'
import RealtimeConnectionPanel from '@/components/portal/RealtimeConnectionPanel'

export default function NotificationsTab() {
  return (
    <div className="mt-4 space-y-6">
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-semibold mb-2">Offline Queue Inspector</h3>
        <OfflineQueueInspector />
      </div>
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-semibold mb-2">Realtime Connection</h3>
        <RealtimeConnectionPanel />
      </div>
    </div>
  )
}
