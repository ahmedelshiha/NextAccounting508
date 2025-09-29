"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminRealtime } from '@/components/dashboard/realtime/RealtimeProvider'

/**
 * useRoleSync
 * - Listens for realtime 'user-role-updated' events
 * - If the event targets the current user, updates the session in-place
 * - Ensures PermissionGate and any role-dependent UI react without a full reload
 */
export function useRoleSync() {
  const { data: session, update } = useSession()
  const { subscribeByTypes } = useAdminRealtime()

  useEffect(() => {
    const unsub = subscribeByTypes(['user-role-updated'], async (evt) => {
      try {
        const userId = (session?.user as any)?.id
        if (!userId) return
        if (evt?.data?.userId && String(evt.data.userId) === String(userId)) {
          const newRole = evt?.data?.role
          if (newRole && typeof update === 'function' && session?.user) {
            await update({ user: { ...(session.user as any), role: newRole } } as any)
          }
        }
      } catch {}
    })
    return () => { try { unsub() } catch {} }
  }, [session?.user?.id])
}

export default useRoleSync
