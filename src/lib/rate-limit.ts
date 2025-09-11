import { cacheGet, cacheSet } from '@/lib/cache'

export type RateLimitResult = { allowed: boolean; remaining: number; resetInMs: number }

const g = globalThis as unknown as { __rl?: Map<string, { count: number; resetAt: number }> }
if (!g.__rl) g.__rl = new Map()
const mem = g.__rl

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const now = Date.now()
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
