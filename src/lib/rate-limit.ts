type Bucket = { tokens: number; last: number }
const buckets = new Map<string, Bucket>()

let redisReady = false
let redisError: Error | null = null
let redisCache: any = null

function ensureRedis() {
  if (redisReady) return
  try {
    const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    const hasRedis = Boolean(process.env.REDIS_URL)
    if (!hasUpstash && !hasRedis) { redisReady = true; return }
    const { default: RedisCache } = require('@/lib/cache/redis')
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    redisCache = new RedisCache(url)
    redisReady = true
  } catch (e: any) {
    redisError = e
    redisReady = true
  }
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
  // Attempt Redis/Upstash backend if configured
  try {
    ensureRedis()
    if (redisCache) {
      const now = Date.now()
      const redisKey = `ratelimit:${key}`
      const payload = { count: 1, resetAt: now + windowMs }
      // Synchronous-ish read/modify since our Redis wrapper is async; but function signature is sync.
      // We cannot block with await here; switch to deoptimistic in-memory if async not allowed.
    }
  } catch {}

  // In-memory fallback token bucket (per process)
  const now = Date.now()
  const bucket = buckets.get(key) || { tokens: limit, last: now }
  const elapsed = now - bucket.last
  const refill = Math.floor(elapsed / windowMs) * limit
  if (refill > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + refill)
    bucket.last = now
  }
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket)
    return false
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return true
}

// Async variant for server code paths that can await
export async function rateLimitAsync(key: string, limit = 20, windowMs = 60_000): Promise<boolean> {
  ensureRedis()
  if (!redisCache) {
    // fall back to sync limiter
    return rateLimit(key, limit, windowMs)
  }
  try {
    const now = Date.now()
    const redisKey = `ratelimit:${key}`
    type Entry = { count: number; resetAt: number }
    const existing = (await redisCache.get<Entry>(redisKey))
    if (!existing) {
      const entry: Entry = { count: 1, resetAt: now + windowMs }
      await redisCache.set(redisKey, entry, Math.ceil(windowMs / 1000))
      return true
    }
    if (existing.resetAt <= now) {
      const entry: Entry = { count: 1, resetAt: now + windowMs }
      await redisCache.set(redisKey, entry, Math.ceil(windowMs / 1000))
      return true
    }
    if (existing.count >= limit) {
      const ttlMs = Math.max(0, existing.resetAt - now)
      await redisCache.set(redisKey, { ...existing, count: existing.count }, Math.ceil(ttlMs / 1000))
      return false
    }
    const ttlMs = Math.max(0, existing.resetAt - now)
    await redisCache.set(redisKey, { count: existing.count + 1, resetAt: existing.resetAt }, Math.ceil(ttlMs / 1000))
    return true
  } catch {
    return rateLimit(key, limit, windowMs)
  }
}
