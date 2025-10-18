type LocalBucket = { count: number; resetAt: number }

type RateLimitBackend = 'redis' | 'memory'

type RedisClient = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>
}

const localBuckets = new Map<string, LocalBucket>()

export function _resetRateLimitBucketsForTests() {
  try { localBuckets.clear() } catch {}
}

let redisReady = false
let redisError: Error | null = null
let redisCache: RedisClient | null = null

function ensureRedis(): void {
  if (redisReady) return
  try {
    const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    const hasRedis = Boolean(process.env.REDIS_URL)
    if (!hasUpstash && !hasRedis) {
      redisReady = true
      return
    }
    // Use require here intentionally to avoid async import in sync path
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: RedisCache } = require('@/lib/cache/redis')
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    redisCache = new RedisCache(url) as RedisClient
  } catch (error: any) {
    redisError = error instanceof Error ? error : new Error(String(error))
    redisCache = null
  } finally {
    redisReady = true
  }
}

function ttlSeconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000))
}

function consumeLocal(key: string, limit: number, windowMs: number): RateLimitDecision {
  const now = Date.now()
  let bucket = localBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
  }

  if (bucket.count >= limit) {
    localBuckets.set(key, bucket)
    return {
      allowed: false,
      backend: 'memory',
      count: bucket.count,
      limit,
      remaining: 0,
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1
  localBuckets.set(key, bucket)

  return {
    allowed: true,
    backend: 'memory',
    count: bucket.count,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  }
}

async function consumeDistributed(key: string, limit: number, windowMs: number): Promise<RateLimitDecision> {
  if (!redisCache) return consumeLocal(key, limit, windowMs)

  const now = Date.now()
  const redisKey = `ratelimit:${key}`
  type Entry = { count: number; resetAt: number }

  const entry = (await redisCache.get<Entry>(redisKey)) ?? null
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs
    const created: Entry = { count: 1, resetAt }
    await redisCache.set(redisKey, created, ttlSeconds(windowMs))
    return {
      allowed: true,
      backend: 'redis',
      count: created.count,
      limit,
      remaining: Math.max(0, limit - created.count),
      resetAt,
    }
  }

  if (entry.count >= limit) {
    const ttlMs = Math.max(1, entry.resetAt - now)
    await redisCache.set(redisKey, entry, ttlSeconds(ttlMs))
    return {
      allowed: false,
      backend: 'redis',
      count: entry.count,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  const updatedCount = entry.count + 1
  const ttlMs = Math.max(1, entry.resetAt - now)
  await redisCache.set(redisKey, { count: updatedCount, resetAt: entry.resetAt }, ttlSeconds(ttlMs))

  return {
    allowed: true,
    backend: 'redis',
    count: updatedCount,
    limit,
    remaining: Math.max(0, limit - updatedCount),
    resetAt: entry.resetAt,
  }
}

export type RateLimitDecision = {
  allowed: boolean
  backend: RateLimitBackend
  count: number
  limit: number
  remaining: number
  resetAt: number
}

export function getClientIp(req: Request): string {
  try {
    const r = req as unknown as { ip?: string; socket?: { remoteAddress?: string } }
    const ip = r?.ip ?? r?.socket?.remoteAddress
    const hdr =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-nf-client-connection-ip') ||
      req.headers.get('cf-connecting-ip') ||
      ''
    const first = hdr.split(',')[0]?.trim()
    return ip || first || 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  // Legacy synchronous callers fall back to process-local buckets only.
  return consumeLocal(key, limit, windowMs).allowed
}

export async function applyRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): Promise<RateLimitDecision> {
  ensureRedis()
  if (!redisCache) {
    return consumeLocal(key, limit, windowMs)
  }

  try {
    return await consumeDistributed(key, limit, windowMs)
  } catch (error: any) {
    redisError = error instanceof Error ? error : new Error(String(error))
    return consumeLocal(key, limit, windowMs)
  }
}

export async function rateLimitAsync(key: string, limit = 20, windowMs = 60_000): Promise<boolean> {
  const decision = await applyRateLimit(key, limit, windowMs)
  return decision.allowed
}

export function getRateLimitBackendState(): {
  redisReady: boolean
  redisError: Error | null
  backend: RateLimitBackend
} {
  ensureRedis()
  return {
    backend: redisCache ? 'redis' : 'memory',
    redisError,
    redisReady,
  }
}
