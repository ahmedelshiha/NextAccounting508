type CacheEntry = { value: any; expiresAt: number | null }

export class CacheService {
  private static store: Map<string, CacheEntry> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const entry = CacheService.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      CacheService.store.delete(key)
      return null
    }
    return entry.value as T
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null
    CacheService.store.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    CacheService.store.delete(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    // Convert simple glob pattern "service-stats:tenant:*" to a regex
    const regex = new RegExp('^' + pattern.split('*').map(this.escapeRegex).join('.*') + '$')
    for (const k of Array.from(CacheService.store.keys())) {
      if (regex.test(k)) CacheService.store.delete(k)
    }
  }

  private escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
