'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Lightweight client-side performance reporter for admin pages.
// Collects core web vitals (LCP, CLS, INP) and basic navigation timings, then
// posts them to /api/admin/perf-metrics (POST). Uses sendBeacon when available.
export default function PerfMetricsReporter() {
  const pathname = usePathname()
  const clsValue = useRef(0)
  const lcpValue = useRef<number | null>(null)
  const inpValue = useRef<number | null>(null)
  const flushTimer = useRef<number | null>(null)

  // Helper to send metrics payload
  const send = (payload: Record<string, any>) => {
    try {
      const body = JSON.stringify({
        ts: Date.now(),
        path: pathname,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr',
        ...payload,
      })
      const url = '/api/admin/perf-metrics'
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      } else {
        // Fire-and-forget; ignore response
        fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body }).catch(() => {})
      }
    } catch {}
  }

  // Observe CLS
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return
    let observer: PerformanceObserver | null = null
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          const e = entry as LayoutShift
          if (!e.hadRecentInput) {
            clsValue.current += e.value
          }
        }
      })
      observer.observe({ type: 'layout-shift', buffered: true } as any)
    } catch {}
    return () => observer?.disconnect()
  }, [])

  // Observe LCP
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return
    let observer: PerformanceObserver | null = null
    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) lcpValue.current = (last as any).renderTime || last.startTime
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true } as any)
    } catch {}
    return () => observer?.disconnect()
  }, [])

  // Observe INP (interaction to next paint) if supported; fallback to first-input
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return
    let observer: PerformanceObserver | null = null
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if ((entry as any).interactionId) {
            // INP-like event
            const dur = Math.round(entry.duration)
            inpValue.current = inpValue.current == null ? dur : Math.max(inpValue.current, dur)
          }
        }
      })
      // Try INP-compatible event type first
      observer.observe({ type: 'event', durationThreshold: 40, buffered: true } as any)
    } catch {
      // Fallback to first-input-delay
      try {
        observer = new PerformanceObserver((list) => {
          const fi = list.getEntries()[0]
          if (fi) inpValue.current = Math.round(fi.processingStart - fi.startTime)
        })
        observer.observe({ type: 'first-input', buffered: true } as any)
      } catch {}
    }
    return () => observer?.disconnect()
  }, [])

  // Send a batched sample shortly after route change or on idle
  useEffect(() => {
    const scheduleFlush = () => {
      if (flushTimer.current) window.clearTimeout(flushTimer.current)
      flushTimer.current = window.setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
        const timing = nav
          ? {
              ttfb: Math.round(nav.responseStart),
              fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0]?.startTime as number) || 0),
              domInteractive: Math.round(nav.domInteractive),
              load: Math.round(nav.loadEventEnd),
            }
          : {}
        send({
          type: 'sample',
          metrics: {
            lcp: lcpValue.current != null ? Math.round(lcpValue.current) : null,
            cls: Math.round(clsValue.current * 1000) / 1000,
            inp: inpValue.current,
            ...timing,
          },
        })
      }, 1500)
    }

    // Initial + on pathname change
    scheduleFlush()
    return () => {
      if (flushTimer.current) window.clearTimeout(flushTimer.current)
    }
  }, [pathname])

  // Flush on page hide
  useEffect(() => {
    const onHide = () => {
      send({ type: 'final', metrics: { lcp: lcpValue.current, cls: clsValue.current, inp: inpValue.current } })
    }
    window.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  return null
}
