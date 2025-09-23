/**
 * Redis-backed Cache wrapper
 * - Tries to use ioredis if a redis:// or rediss:// URL is provided
 * - If UPSTASH_REDIS_REST_URL (http/https) is provided, uses Upstash REST API
 * - Mirrors the in-memory CacheService API: get/set/delete/deletePattern
 */

// Minimal type to avoid hard dependency at build
type MaybeAny = any

export default class RedisCache {
  private client: MaybeAny | null = null
  private rest: { baseUrl: string; token: string } | null = null

  constructor(url?: string) {
    const redisUrl = url || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    if (!redisUrl) throw new Error('REDIS_URL not configured')

    // If URL is http/https, switch to Upstash REST mode
    if (/^https?:\/\//i.test(redisUrl)) {
      const token = process.env.UPSTASH_REDIS_REST_TOKEN
      if (!token) throw new Error('UPSTASH_REDIS_REST_TOKEN not configured for Upstash REST')
      this.rest = { baseUrl: redisUrl.replace(/\/$/, ''), token }
      return
    }

    // Otherwise, use ioredis TCP client
    let IORedis: any
    try {
      // eslint-disable-next-line no-eval
      const req: any = eval('require')
      IORedis = req('ioredis')
    } catch (err) {
      throw new Error('ioredis not installed. Install ioredis or provide UPSTASH_REDIS_REST_URL/TOKEN')
    }
    this.client = new IORedis(redisUrl)
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.rest) {
      const res = await this.restFetch(`${this.rest.baseUrl}/get/${encodeURIComponent(key)}`)
      const value = res?.result
      if (value == null) return null
      try { return JSON.parse(value) as T } catch { return value as unknown as T }
    }
    const raw = await this.client.get(key)
    if (raw == null) return null
    try { return JSON.parse(raw) as T } catch { return null }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value)
    if (this.rest) {
      const url = new URL(`${this.rest.baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(raw)}`)
      if (ttlSeconds && ttlSeconds > 0) url.searchParams.set('EX', String(ttlSeconds))
      await this.restFetch(url.toString(), { method: 'POST' })
      return
    }
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, raw, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, raw)
    }
  }

  async delete(key: string): Promise<void> {
    if (this.rest) {
      await this.restFetch(`${this.rest.baseUrl}/del/${encodeURIComponent(key)}`, { method: 'POST' })
      return
    }
    await this.client.del(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    if (this.rest) {
      // Use SCAN loop via REST to find matching keys, then delete one by one
      let cursor = '0'
      const match = pattern
      do {
        const url = new URL(`${this.rest.baseUrl}/scan/${cursor}`)
        url.searchParams.set('MATCH', match)
        url.searchParams.set('COUNT', '100')
        const res = await this.restFetch(url.toString())
        const [next, keys] = Array.isArray(res?.result) ? res.result : ['0', []]
        if (Array.isArray(keys) && keys.length) {
          for (const k of keys) {
            await this.restFetch(`${this.rest.baseUrl}/del/${encodeURIComponent(k)}`, { method: 'POST' })
          }
        }
        cursor = String(next || '0')
      } while (cursor !== '0')
      return
    }

    // ioredis path: scanStream + pipeline
    const stream = this.client.scanStream({ match: pattern, count: 100 })
    const pipeline = this.client.pipeline()
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if (keys?.length) keys.forEach((k: string) => pipeline.del(k))
      })
      stream.on('end', async () => {
        try { if (pipeline.length) await pipeline.exec(); resolve() } catch (e) { reject(e) }
      })
      stream.on('error', (err: any) => reject(err))
    })
  }

  private async restFetch(url: string, init?: RequestInit) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.rest!.token}`,
      'Accept': 'application/json',
    }
    const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers as any) } })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Upstash REST error ${res.status}: ${text}`)
    }
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) return res.json()
    try { return { result: await res.text() } } catch { return { result: null } }
  }
}
