"use client"

import React, { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/ui/footer'

interface ClientLayoutProps {
  children: React.ReactNode
}

// extend Window to store a fetch flag without using `any`
declare global {
  interface Window {
    __fetchLogged?: boolean
  }
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
    const originalFetch: typeof fetch = window.fetch.bind(window)
    // Only wrap once
    if (!window.__fetchLogged) {
      window.__fetchLogged = true
      window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        try {
          const [i0, init] = args
          const input = i0
          // Delegate to the original (already proxy-wrapped) fetch without altering URL shape
          const res = await originalFetch(...([input, init] as [RequestInfo | URL, RequestInit | undefined]))
          if (!res.ok) {
            try {
              const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : (input instanceof URL ? input.toString() : String(input)))
              const method = ((init && init.method) || (input instanceof Request ? input.method : 'GET') || 'GET').toString().toUpperCase()
              // Skip logging for keep-alive pings and HEAD requests
              if (method !== 'HEAD' && !url.includes('/api/admin/health-history')) {
                console.error('[fetch] non-ok response', { status: res.status, url, init })
              }
            } catch {}
          }
          return res
        } catch (err: unknown) {
          try {
            // Log rich details to console to help debugging
            const [input, init] = args
            const info: Record<string, unknown> = { init: init ?? null }
            if (typeof input === 'string') info.input = input
            else if (input instanceof Request) {
              info.input = input.url
              info.requestMethod = input.method
              try {
                info.requestHeaders = Object.fromEntries(Array.from(input.headers.entries()))
              } catch {}
            } else if (input instanceof URL) {
              info.input = input.toString()
            } else {
              info.input = String(input)
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
      // restore fetch flag
      try {
        if (window.__fetchLogged) {
          delete window.__fetchLogged
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const id = setInterval(() => {
        fetch('/api/admin/health-history?ping=1', { method: 'GET', cache: 'no-store' }).catch(() => {})
      }, 30000)
      return () => clearInterval(id)
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
