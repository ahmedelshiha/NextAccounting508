import type { NextRequest } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'

export type RateLimitResult = { allowed: boolean; remaining: number; resetInMs: number }

const g = globalThis as unknown as { __rl?: Map<string, { count: number; resetAt: number }> }
if (!g.__rl) g.__rl = new Map()
const mem = g.__rl

export function getClientIp(req: Request | NextRequest): string {
  try {
    const headers = (req as any).headers || (typeof (req as any).headers === 'function' ? (req as any).headers() : null)
    const get = (name: string) => {
      try { return headers?.get ? headers.get(name) : undefined } catch { return undefined }
    }
    const xff = get('x-forwarded-for') || ''
    const real = get('x-real-ip') || ''
    const nf = get('x-nf-client-connection-ip') || ''
    const cip = get('client-ip') || ''
    const candidates = [xff.split(',')[0]?.trim(), real, nf, cip].filter(Boolean)
    return candidates[0] || 'unknown'
  } catch {
    return 'unknown'
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean
export function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult>
export async function rateLimit(key: string, limit: number, window: number): Promise<RateLimitResult> | boolean {
  const now = Date.now()

  if (window >= 1000) {
    const bucketKey = `rl:${key}`
    let state = mem.get(bucketKey)
    if (!state || state.resetAt <= now) {
      state = { count: 0, resetAt: now + window }
    }
    state.count += 1
    const allowed = state.count <= limit
    mem.set(bucketKey, state)
    return allowed
  }

  const windowSec = window
  const bucketKey = `rl:${key}`

  let state = mem.get(bucketKey)
  if (!state || state.resetAt <= now) {
    state = { count: 0, resetAt: now + windowSec * 1000 }
  }

  const dist = await cacheGet<{ c: number; r: number }>(bucketKey)
  if (dist && dist.r > now) {
    state.count = Math.max(state.count, dist.c)
    state.resetAt = Math.max(state.resetAt, dist.r)
  }

  state.count += 1
  const allowed = state.count <= limit
  const remaining = Math.max(0, limit - state.count)
  const resetInMs = Math.max(0, state.resetAt - now)

  mem.set(bucketKey, state)
  await cacheSet(bucketKey, { c: state.count, r: state.resetAt }, Math.ceil(resetInMs / 1000))

  return { allowed, remaining, resetInMs }
}
