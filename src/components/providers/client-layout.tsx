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

    // Debugging helper: opt-in fetch logging (set NEXT_PUBLIC_DEBUG_FETCH=1 to enable)
    const originalFetch: typeof fetch = window.fetch.bind(window)
    // Only wrap once and only when explicitly enabled
    if (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1' && !window.__fetchLogged) {
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
              if (method !== 'HEAD' && !url.includes('/api/health-history')) {
                console.error('[fetch] non-ok response', { status: res.status, url, init })
              }
            } catch {}
          }
          return res
        } catch (err: unknown) {
          try {
            const [input, init] = args
            // Derive url/method robustly across realms
            const derivedMethod = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toString().toUpperCase()
            const url = typeof input === 'string'
              ? input
              : input instanceof Request
                ? input.url
                : input instanceof URL
                  ? input.toString()
                  : ''

            const isNextInternal = url.includes('/_next') || url.includes('?reload=') || url.includes('builder.lazyLoadImages')
            const isKeepAlive = url.includes('/api/health-history')
            const isApi = url.includes('/api/')
            const isHead = derivedMethod === 'HEAD'
            const offline = typeof navigator !== 'undefined' && navigator.onLine === false

            if (!isNextInternal && !isKeepAlive && isApi && !isHead && !offline) {
              console.warn('[fetch] network/error while fetching', { url, method: derivedMethod, init: init ?? null }, err)
            }
          } catch {
            // avoid noisy console errors during dev
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
        fetch('/api/health-history?ping=1', { method: 'GET', cache: 'no-store' }).catch(() => {})
      }, 30000)
      return () => clearInterval(id)
    }
  }, [])

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0} staleTime={Infinity}>
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
