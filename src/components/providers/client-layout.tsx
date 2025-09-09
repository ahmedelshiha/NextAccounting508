"use client"

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/ui/footer'

interface ClientLayoutProps {
  children: React.ReactNode
}

import { CurrencyProvider } from '@/components/providers/currency-provider'

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </CurrencyProvider>
    </SessionProvider>
  )
}
