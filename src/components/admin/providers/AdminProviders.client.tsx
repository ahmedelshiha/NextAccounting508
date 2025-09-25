'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { SessionProvider } from 'next-auth/react'
import { AdminContextProvider } from './AdminContext'
import { Toaster } from '@/components/ui/sonner'
import { RealtimeProvider } from '@/components/dashboard/realtime/RealtimeProvider'

interface AdminProvidersProps {
  children?: ReactNode
  session?: any
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export default function AdminProvidersClient({ children, session }: AdminProvidersProps) {
  return (
    <SessionProvider session={session}>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          refreshInterval: 300000,
          errorRetryCount: 3,
          onError: (err) => {
            console.error('SWR error:', err)
          },
        }}
      >
        <AdminContextProvider>
          <RealtimeProvider
            events={['service-request-updated', 'task-updated', 'availability-updated', 'team-assignment', 'all']}
          >
            {children}
            <Toaster richColors />
          </RealtimeProvider>
        </AdminContextProvider>
      </SWRConfig>
    </SessionProvider>
  )
}
