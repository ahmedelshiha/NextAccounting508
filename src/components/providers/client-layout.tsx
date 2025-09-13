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

    const reloadWithBuster = () => {
      try {
        const key = 'lastChunkReload'
        const now = Date.now()
        const last = Number(sessionStorage.getItem(key) || '0')
        if (now - last < 15000) return
        sessionStorage.setItem(key, String(now))
        const url = new URL(window.location.href)
        url.searchParams.set('v', String(now))
        window.location.replace(url.toString())
      } catch {
        window.location.reload()
      }
    }

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
            setTimeout(reloadWithBuster, 600)
          }
        }
        // Suppress dev overlay noise for Next HMR/network hiccups and try to auto-recover
        if (/failed to fetch/i.test(msgStr)) {
          try { event.preventDefault?.() } catch {}
          if (!handled) {
            handled = true
            console.warn('Detected failed fetch (dev/HMR). Reloading to recover.')
            setTimeout(reloadWithBuster, 600)
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

        const msgStr = String(msg)
        if (/loading chunk|chunkloaderror|cannot find module/i.test(msgStr)) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error from unhandledrejection, reloading page.', msgStr)
            setTimeout(reloadWithBuster, 600)
          }
        }
        // Suppress dev overlay noise for HMR-related fetch errors and auto-recover
        if (/failed to fetch/i.test(msgStr) || /hot-reloader|\?reload=|hmr/i.test(msgStr)) {
          try { ev.preventDefault?.() } catch {}
          if (!handled) {
            handled = true
            console.warn('Detected HMR fetch failure. Reloading to recover.')
            setTimeout(reloadWithBuster, 600)
          }
        }
      } catch {
        // ignore
      }
    }

    // Debugging helper: opt-in fetch logging (set NEXT_PUBLIC_DEBUG_FETCH=1 to enable)
    const originalFetch: typeof fetch = window.fetch.bind(window)
    // Always wrap once. We will only log when the debug flag is set OR when the request targets /api/auth/.
    if (!window.__fetchLogged) {
      window.__fetchLogged = true
      window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const [input, init] = args
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : (input instanceof URL ? input.toString() : String(input)))
        const method = ((init && init.method) || (input instanceof Request ? input.method : 'GET') || 'GET').toString().toUpperCase()
        const isAuth = url.includes('/api/auth/')
        const isNextInternal = url.includes('/_next') || url.includes('?reload=') || url.includes('builder.lazyLoadImages')
        const isKeepAlive = url.includes('/api/admin/health-history')
        const isApi = url.includes('/api/')
        const isHead = method === 'HEAD'
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false
        const debug = process.env.NEXT_PUBLIC_DEBUG_FETCH === '1'

        // If not debugging and not auth-related, delegate directly
        if (!debug && !isAuth) return originalFetch(...([input, init] as [RequestInfo | URL, RequestInit | undefined]))

        try {
          const res = await originalFetch(...([input, init] as [RequestInfo | URL, RequestInit | undefined]))

          if (!res.ok && (debug || isAuth)) {
            try {
              // Clone to read body safely
              const bodyText = await res.clone().text()
              console.error('[fetch] non-ok response', { status: res.status, url, method, init, body: bodyText })
            } catch (e) {
              console.error('[fetch] non-ok response (no body)', { status: res.status, url, method, init })
            }
          }

          return res
        } catch (err: unknown) {
          try {
            // Only report relevant API failures to avoid noise
            if (!isNextInternal && !isKeepAlive && isApi && !isHead && !offline) {
              console.error('[fetch] network/error while fetching', { url, method, init }, err)
            }
            // Always log auth-related fetch failures so we can diagnose NextAuth issues
            if (isAuth) {
              console.error('[fetch] NextAuth fetch failed', { url, method, init }, err)
            }
          } catch {}
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
    // no-op: removed keepalive ping to avoid dev fetch noise
  }, [])

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
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
