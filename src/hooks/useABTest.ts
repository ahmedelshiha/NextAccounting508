"use client"

import { useEffect, useMemo, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

export type ABVariant = 'control' | 'variant-a' | string

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}`
}

function hashString(str: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}

function getVisitorId() {
  const key = 'af_vid'
  let vid = getCookie(key)
  if (!vid) {
    vid = Math.random().toString(36).slice(2)
    setCookie(key, vid)
  }
  return vid
}

export function useABTest(testName: string, variants: ABVariant[] = ['control','variant-a']) {
  const [assigned, setAssigned] = useState<ABVariant>('control')

  const params = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }, [])

  useEffect(() => {
    const cookieKey = `ab_${testName}`
    const override = params.get('ab') as ABVariant | null
    if (override && variants.includes(override)) {
      setAssigned(override)
      setCookie(cookieKey, override)
      trackEvent('ab_test_assigned', { test: testName, variant: override, source: 'query' })
      return
    }
    const existing = getCookie(cookieKey) as ABVariant | null
    if (existing && variants.includes(existing)) {
      setAssigned(existing)
      return
    }
    const vid = getVisitorId()
    const h = hashString(`${testName}:${vid}`)
    const idx = h % variants.length
    const pick = variants[idx]
    setAssigned(pick)
    setCookie(cookieKey, pick)
    trackEvent('ab_test_assigned', { test: testName, variant: pick, source: 'hash' })
  }, [params, testName, variants])

  return assigned
}
