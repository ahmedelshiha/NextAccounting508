"use client"

import React, { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/ui/footer'
import LiveChatWidget from '@/components/portal/LiveChatWidget'

interface ClientLayoutProps {
  children: React.ReactNode
  session?: Session | null
}

// extend Window to store a fetch flag without using `any`
declare global {
  interface Window {
    __fetchLogged?: boolean
  }
}

export function ClientLayout({ children, session }: ClientLayoutProps) {
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

        const msgStr = String(message || '')
        if (/loading chunk|chunkloaderror|loading asset/i.test(msgStr)) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error, reloading page to recover.', msgStr)
            setTimeout(() => window.location.reload(), 800)
          }
        }
        // Suppress dev overlay noise for Next HMR/network hiccups
        if (/failed to fetch/i.test(msgStr)) {
          try { event.preventDefault?.() } catch {}
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

        const msgStr = String(msg)
        if (/loading chunk|chunkloaderror|cannot find module/i.test(msgStr)) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error from unhandledrejection, reloading page.', msgStr)
            setTimeout(() => window.location.reload(), 800)
          }
        }
        // Suppress dev overlay noise for HMR-related fetch errors
        if (/failed to fetch/i.test(msgStr) || /hot-reloader|\?reload=|hmr/i.test(msgStr)) {
          try { ev.preventDefault?.() } catch {}
        }
      } catch {
        // ignore
      }
    }

    // Debugging helper: opt-in fetch logging (set NEXT_PUBLIC_DEBUG_FETCH=1 to enable)
    const originalFetch: typeof fetch = window.fetch.bind(window)
    const enableWrapper = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEBUG_FETCH === '1'
    // Only wrap once and only when enabled
    if (enableWrapper && !window.__fetchLogged) {
      window.__fetchLogged = true
      window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        try {
          const [i0, init] = args
          const input = i0
          // Delegate to the original fetch
          const res = await originalFetch(...([input, init] as [RequestInfo | URL, RequestInit | undefined]))

          // If debug logging explicitly enabled, preserve non-ok logging
          if (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1' && !res.ok) {
            try {
              const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : (input instanceof URL ? input.toString() : String(input)))
              const method = ((init && init.method) || (input instanceof Request ? input.method : 'GET') || 'GET').toString().toUpperCase()
              if (method !== 'HEAD' && !url.includes('/api/admin/health-history')) {
                console.error('[fetch] non-ok response', { status: res.status, url, init })
              }
            } catch {}
          }

          return res
        } catch (err: unknown) {
          // On fetch failure (network issue or malformed input), try to derive context and return a safe 503 Response
          try {
            const [input, init] = args
            const derivedMethod = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toString().toUpperCase()
            const url = typeof input === 'string'
              ? input
              : input instanceof Request
                ? input.url
                : input instanceof URL
                  ? input.toString()
                  : typeof input === 'object' ? JSON.stringify(input as object) : String(input)

            const isNextInternal = typeof url === 'string' && (url.includes('/_next') || url.includes('?reload=') || url.includes('builder.lazyLoadImages'))
            const isKeepAlive = typeof url === 'string' && url.includes('/api/admin/health-history')
            const isApi = typeof url === 'string' && url.includes('/api/')
            const isHead = derivedMethod === 'HEAD'
            const offline = typeof navigator !== 'undefined' && navigator.onLine === false

            if (!isNextInternal && !isKeepAlive && isApi && !isHead && !offline) {
              console.warn('[fetch] network/error while fetching', { url, method: derivedMethod, init: init ?? null }, err)
            }
          } catch {
            // ignore
          }

          // Return a safe 503 JSON response instead of throwing so callers (like next-auth) get a Response object
          try {
            const body = typeof err === 'string' ? err : JSON.stringify({ error: String(err) })
            return new Response(body, { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } })
          } catch {
            // Fallback: rethrow if Response construction fails
            throw err
          }
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
    // no-op: removed keepalive ping to avoid dev fetch noise
  }, [])

  // When connectivity returns, attempt to process any queued submissions
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === '1') {
      const onOnline = () => { import('@/lib/offline-queue').then(mod => { mod.processQueuedServiceRequests?.().catch(() => {}) }) }
      window.addEventListener('online', onOnline)
      return () => window.removeEventListener('online', onOnline)
    }
  }, [])

  // PWA registration (flag-gated)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === '1' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        try { navigator.serviceWorker.register('/sw.js') } catch {}
        import('@/lib/offline-queue').then(mod => { mod.registerBackgroundSync?.().catch(() => {}) }).catch(() => {})
      })
    }
  }, [])

  const [showPortalChat, setShowPortalChat] = React.useState(false)

  React.useEffect(() => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      setShowPortalChat(path.startsWith('/portal'))
    } catch {
      setShowPortalChat(false)
    }
  }, [])

  return (
    <SessionProvider session={session as any} refetchOnWindowFocus={false} refetchInterval={0}>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      {showPortalChat ? <LiveChatWidget /> : null}
      <Toaster />
    </SessionProvider>
  )
}
