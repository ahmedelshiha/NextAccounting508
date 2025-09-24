'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { SessionProvider } from 'next-auth/react'
import { AdminContextProvider } from './AdminContext'
import { Toaster } from '@/components/ui/sonner'

interface AdminProvidersProps {
  children: ReactNode
  session: any
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export function AdminProviders({ children, session }: AdminProvidersProps) {
  return (
    <SessionProvider session={session}>
      {/* Configure SWR globally for admin area */}
      <SWRConfig value={{
        fetcher,
        revalidateOnFocus: false,
        refreshInterval: 300000, // 5 minutes
        errorRetryCount: 3,
        onError: (err) => {
          // eslint-disable-next-line no-console
          console.error('SWR error:', err)
        }
      }}>
        <AdminContextProvider>
          {children}
          {/* App-wide notifications (Sonner) */}
          <Toaster richColors />
        </AdminContextProvider>
      </SWRConfig>
    </SessionProvider>
  )
}
