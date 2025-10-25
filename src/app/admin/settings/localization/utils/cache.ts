/**
 * API Cache Utility with TTL and Request Deduplication
 * 
 * This module provides a caching layer for API responses to:
 * 1. Reduce repeated API calls by caching responses with TTL
 * 2. Deduplicate in-flight requests (same request returns same promise)
 * 3. Provide manual cache invalidation for mutations
 * 4. Track cache statistics for monitoring
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private inFlightRequests: Map<string, Promise<any>> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  }

  /**
   * Get cached value if exists and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return null
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  /**
   * Set cache value with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
    this.stats.sets++
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
    this.stats.deletes++
  }

  /**
   * Delete all cache entries matching a pattern (for bulk invalidation)
   */
  deletePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    let deleted = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deleted++
      }
    }

    this.stats.deletes += deleted
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.stats.deletes += size
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    }
  }

  /**
   * Track in-flight request and return shared promise
   */
  trackInFlight<T>(key: string, promise: Promise<T>): Promise<T> {
    this.inFlightRequests.set(key, promise)
    return promise.finally(() => {
      this.inFlightRequests.delete(key)
    })
  }

  /**
   * Get in-flight request if exists
   */
  getInFlight<T>(key: string): Promise<T> | null {
    return (this.inFlightRequests.get(key) as Promise<T>) || null
  }
}

// Global cache instance
export const apiCache = new APICache()

/**
 * Generate cache key from URL and optional parameters
 */
export function generateCacheKey(url: string, params?: Record<string, any>): string {
  const baseKey = url.replace(/^.*api/, 'api')
  if (!params || Object.keys(params).length === 0) {
    return baseKey
  }

  const paramString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = String(value)
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return `${baseKey}?${paramString}`
}

/**
 * Generate cache key for form of method + URL
 */
export function generateCacheKeyWithMethod(method: string, url: string): string {
  return `${method}:${url}`
}
