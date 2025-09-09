"use client"

import React, { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/ui/footer'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    let handled = false

    const handleError = (event: ErrorEvent) => {
      try {
        const err = (event && (event as any).error) || event
        const message = err?.message || (event && (event as any).message) || ''
        if (/loading chunk|chunkloaderror|loading asset/i.test(String(message))) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error, reloading page to recover.', message)
            setTimeout(() => window.location.reload(), 800)
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const handleRejection = (ev: PromiseRejectionEvent) => {
      try {
        const reason = (ev && (ev as any).reason) || ev
        const msg = (reason && (reason.message || reason.stack)) || String(reason || '')
        if (/loading chunk|chunkloaderror|cannot find module/i.test(String(msg))) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error from unhandledrejection, reloading page.', msg)
            setTimeout(() => window.location.reload(), 800)
          }
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <Toaster />
    </SessionProvider>
  )
}
