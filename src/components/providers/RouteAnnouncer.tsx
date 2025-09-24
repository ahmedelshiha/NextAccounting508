"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * AccessibleRouteAnnouncer announces route changes for screen readers.
 * It uses a visually hidden live region with polite updates.
 */
export default function AccessibleRouteAnnouncer() {
  const pathname = usePathname()
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const title = typeof document !== 'undefined' ? document.title : ''
      const text = title && title.trim().length > 0 ? title : pathname || '/'
      setMessage(`Navigated to ${text}`)
    } catch {
      setMessage(`Navigated to ${pathname || '/'}`)
    }
  }, [pathname])

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
      data-testid="route-announcer"
    >
      {message}
    </div>
  )
}
