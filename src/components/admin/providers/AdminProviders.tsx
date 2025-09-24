'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { SessionProvider } from 'next-auth/react'
import { AdminContextProvider } from './AdminContext'
import { Toaster } from '@/components/ui/sonner'
import { RealtimeProvider } from '@/components/dashboard/realtime/RealtimeProvider'

interface AdminProvidersProps {
  children: ReactNode
  session: any
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

/**
 * AdminProviders composes global providers for the admin area in a predictable order:
 * - SessionProvider: authentication/session context (next-auth)
 * - SWRConfig: data fetching defaults (fetcher, retries, focus behavior)
 * - AdminContextProvider: UI/RBAC state for the dashboard shell
 * - RealtimeProvider: SSE-based realtime events to trigger refreshes and toasts
 * - Toaster: cross-app notification surface
 */
export function AdminProviders({ children, session }: AdminProvidersProps) {
  return (
    <SessionProvider session={session}>
      {/* SWR defaults are centralized here to ensure consistent behavior across admin pages */}
      <SWRConfig value={{
        fetcher,
        revalidateOnFocus: false,
        refreshInterval: 300000, // 5 minutes
        errorRetryCount: 3,
        onError: (err) => {
          // Keep logging minimal and non-intrusive in production; Sentry captures details elsewhere
          // eslint-disable-next-line no-console
          console.error('SWR error:', err)
        }
      }}>
        <AdminContextProvider>
          {/* Realtime events used by hooks (e.g., useUnifiedData) to kick revalidation */}
          <RealtimeProvider events={[
            'service-request-updated',
            'task-updated',
            'availability-updated',
            'team-assignment',
            'all'
          ]}>
            {children}
            {/* App-wide notifications (Sonner) */}
            <Toaster richColors />
          </RealtimeProvider>
        </AdminContextProvider>
      </SWRConfig>
    </SessionProvider>
  )
}
