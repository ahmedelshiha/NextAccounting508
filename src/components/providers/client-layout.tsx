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
        const evt = event as ErrorEvent & { error?: unknown }
        const err = evt.error ?? evt
        let message = ''

        if (typeof err === 'string') message = err
        else if (err && typeof (err as { message?: unknown }).message === 'string') {
          message = (err as { message: string }).message
        } else if (typeof evt.message === 'string') {
          message = evt.message
        }

        if (/loading chunk|chunkloaderror|loading asset/i.test(String(message))) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error, reloading page to recover.', message)
            setTimeout(() => window.location.reload(), 800)
          }
        }
      } catch {
        // ignore
      }
    }

    const handleRejection = (ev: PromiseRejectionEvent) => {
      try {
        const evt = ev as PromiseRejectionEvent & { reason?: unknown }
        const reason = evt.reason ?? evt
        let msg = ''

        if (typeof reason === 'string') msg = reason
        else if (reason && typeof (reason as { message?: unknown }).message === 'string') {
          msg = (reason as { message: string }).message
        } else if (typeof (reason as { stack?: unknown }).stack === 'string') {
          msg = (reason as { stack: string }).stack
        } else {
          msg = String(reason || '')
        }

        if (/loading chunk|chunkloaderror|cannot find module/i.test(String(msg))) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error from unhandledrejection, reloading page.', msg)
            setTimeout(() => window.location.reload(), 800)
          }
        }
      } catch {
        // ignore
      }
    }

    // Debugging helper: wrap window.fetch to log failing requests (helps diagnose next-auth CLIENT_FETCH_ERROR)
    const originalFetch = window.fetch.bind(window)
    // Only wrap once
    if (!(window as any).__fetchLogged) {
      (window as any).__fetchLogged = true
      window.fetch = async (input: RequestInfo, init?: RequestInit) => {
        try {
          const res = await originalFetch(input as any, init)
          if (!res.ok) {
            try {
              console.error('[fetch] non-ok response', { input, init, status: res.status, url: typeof input === 'string' ? input : (input as Request).url })
            } catch {}
          }
          return res
        } catch (err) {
          try {
            // Log rich details to console to help debugging
            const info: any = { input, init }
            if (input instanceof Request) {
              info.requestUrl = input.url
              info.requestMethod = input.method
              info.requestHeaders = Object.fromEntries(Array.from(input.headers.entries()))
            }
            console.error('[fetch] network/error while fetching', info, err)
          } catch (e) {
            console.error('[fetch] failed and failed to log details', e)
          }
          throw err
        }
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
      // restore fetch if we wrapped it
      try {
        if ((window as any).__fetchLogged) {
          delete (window as any).__fetchLogged
          // best effort: cannot reliably restore originalFetch reference here, reload to clean up
        }
      } catch {}
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
