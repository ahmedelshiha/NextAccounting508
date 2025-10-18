'use client'

import { useEffect, useState } from 'react'
import { useSidebarCollapsed } from '@/stores/admin/layout.store.selectors'

export default function SidebarLiveRegion() {
  const collapsed = useSidebarCollapsed()
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMessage(collapsed ? 'Sidebar collapsed' : 'Sidebar expanded')
  }, [collapsed])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="sidebar-live-region">
      {message}
    </div>
  )
}
