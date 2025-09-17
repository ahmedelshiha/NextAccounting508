'use client'

import React from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { disconnectRealtimeClients } from '@/hooks/useRealtime'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  after?: () => void
}

export default function LogoutButton({ className = '', after, ...rest }: Props) {
  const router = useRouter()

  const handleLogout = async (e?: React.MouseEvent) => {
    try {
      // Disconnect realtime clients to prevent further events
      try { disconnectRealtimeClients() } catch {}

      // Clear storage
      try {
        sessionStorage.clear()
        localStorage.clear()
      } catch {}

      // Best-effort server-side audit log (optional)
      try {
        void fetch('/api/admin/auth/logout', { method: 'POST' })
      } catch {}

      // Use NextAuth signOut which will clear session cookies and redirect
      await signOut({ callbackUrl: '/login' })

      // Fallback redirect
      try { router.push('/login') } catch {}

      if (after) after()
    } catch (err) {
      // best-effort: still redirect
      try { await signOut({ callbackUrl: '/login' }) } catch {}
    }
  }

  return (
    <button
      {...rest}
      onClick={(e) => {
        if (rest.onClick) rest.onClick(e)
        void handleLogout(e)
      }}
      className={className}
      type="button"
    >
      Sign Out
    </button>
  )
}
