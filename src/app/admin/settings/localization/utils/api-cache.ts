/**
 * Simple in-memory cache for API responses
 * Reduces redundant API calls and improves performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  /**
   * Set cache TTL (time-to-live) in milliseconds
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  /**
   * Get value from cache if valid and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    })
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const apiCache = new APICache()

/**
 * Utility function to fetch with automatic caching
 * @param url - The API endpoint
 * @param options - Fetch options (GET requests are cached by default)
 * @param cacheTTL - Cache time-to-live in milliseconds
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheTTL?: number
): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET'
  
  // Only cache GET requests
  if (method === 'GET') {
    const cached = apiCache.get<T>(url)
    if (cached) {
      return cached
    }
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || `API request failed: ${response.status}`)
  }

  // Cache successful GET responses
  if (method === 'GET') {
    apiCache.set(url, data, cacheTTL)
  }

  return data
}

/**
 * Hook-compatible hook to use cached fetch
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  cacheTTL?: number
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const data = await cachedFetch<T>(url, options, cacheTTL)
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Invalidate cache for a specific endpoint pattern
 * Useful for invalidating cache after mutations
 */
export function invalidateCache(pattern: string): void {
  for (const key of apiCache['cache'].keys()) {
    if (key.includes(pattern)) {
      apiCache.clear(key)
    }
  }
}
