'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'

/**
 * Background tenant context synchronization hook
 * 
 * This hook ensures the tenant context remains synchronized across:
 * - Session changes (login/logout)
 * - Tab/window focus changes
 * - Server-side tenant resolution updates
 * - Multi-tenant awareness
 * 
 * The system automatically:
 * 1. Detects tenant from session (primary)
 * 2. Falls back to subdomain/headers (multi-tenancy)
 * 3. Syncs with background API requests
 * 4. Updates on session refresh
 */
export function useTenantSync(): void {
  const { data: session, status } = useSession()
  const syncRef = useRef<{ lastTenantId: string | null; syncCount: number }>({
    lastTenantId: null,
    syncCount: 0,
  })

  useEffect(() => {
    // Only sync when session is loaded
    if (status !== 'authenticated') {
      return
    }

    const user = (session?.user as any) || {}
    const currentTenantId = user.tenantId ?? null

    // Track tenant changes
    if (syncRef.current.lastTenantId !== currentTenantId) {
      syncRef.current.lastTenantId = currentTenantId
      syncRef.current.syncCount += 1

      try {
        // Emit custom event for other components to listen to tenant changes
        const event = new CustomEvent('tenantChanged', {
          detail: {
            tenantId: currentTenantId,
            tenantSlug: user.tenantSlug ?? null,
            tenantRole: user.tenantRole ?? null,
            timestamp: Date.now(),
          },
        })
        window.dispatchEvent(event)
      } catch (err) {
        // Silently fail in non-browser environments
      }

      // Log tenant context for debugging
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useTenantSync] Tenant context updated', {
            tenantId: currentTenantId,
            tenantSlug: user.tenantSlug,
            tenantRole: user.tenantRole,
            syncCount: syncRef.current.syncCount,
          })
        }
      } catch {}
    }
  }, [session, status])

  // Handle visibility changes to refresh context if tab comes into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        // Trigger a session refresh when tab becomes visible
        // This ensures tenant context is up-to-date
        try {
          window.dispatchEvent(new Event('tenantRefresh'))
        } catch {}
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [status])
}

/**
 * Listen to tenant context changes
 * Used internally by components that need to react to tenant switches
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   const handleTenantChange = (event: Event) => {
 *     const { tenantId } = (event as CustomEvent).detail
 *     console.log('Tenant changed to:', tenantId)
 *   }
 *   window.addEventListener('tenantChanged', handleTenantChange)
 *   return () => window.removeEventListener('tenantChanged', handleTenantChange)
 * }, [])
 * ```
 */
export function onTenantChanged(
  callback: (detail: { tenantId: string | null; tenantSlug: string | null; tenantRole: string | null; timestamp: number }) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  try {
    window.addEventListener('tenantChanged', handler)
    return () => window.removeEventListener('tenantChanged', handler)
  } catch {
    return () => {}
  }
}

/**
 * Ensure API requests include tenant context in headers
 * This is called automatically by the API wrapper, but can be used
 * for manual requests when needed
 * 
 * @param {Record<string, string>} headers - Headers object to update
 * @param {string | null} tenantId - Tenant ID to include
 * @returns {Record<string, string>} Updated headers with tenant context
 */
export function addTenantToHeaders(
  headers: Record<string, string>,
  tenantId: string | null
): Record<string, string> {
  if (tenantId) {
    return {
      ...headers,
      'x-tenant-id': tenantId,
    }
  }
  return headers
}
