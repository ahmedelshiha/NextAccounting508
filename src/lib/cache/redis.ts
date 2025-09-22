/**
 * Redis-backed Cache wrapper
 * - Tries to use ioredis if available at runtime
 * - Falls back to throwing if no Redis URL is configured
 * - Methods mirror the in-memory CacheService API
 */

type MaybeAny = any

export default class RedisCache {
  private client: MaybeAny

  constructor(url?: string) {
    const redisUrl = url || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    if (!redisUrl) throw new Error('REDIS_URL not configured')

    let IORedis: any
    try {
      // Prefer ioredis for server deployments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      IORedis = require('ioredis')
    } catch (err) {
      throw new Error('ioredis not installed. Install ioredis or unset REDIS_URL to use in-memory cache')
    }

    // ioredis constructor accepts connection string
    this.client = new IORedis(redisUrl)
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key)
    if (raw == null) return null
    try { return JSON.parse(raw) as T } catch { return null }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, raw, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, raw)
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    // Convert pattern like 'service:*' expected. Use SCAN to avoid blocking Redis.
    const stream = this.client.scanStream({ match: pattern, count: 100 })
    const pipeline = this.client.pipeline()
    let toDelete: string[] = []
    return new Promise((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          keys.forEach((k: string) => pipeline.del(k))
        }
      })
      stream.on('end', async () => {
        try {
          if (pipeline.length) await pipeline.exec()
          resolve(undefined)
        } catch (e) { reject(e) }
      })
      stream.on('error', (err: any) => reject(err))
    })
  }
}
