'use client'

import { useCallback } from 'react'
import { apiCache, generateCacheKey, generateCacheKeyWithMethod } from '../utils/cache'
import { useFetchWithTimeout } from './useFetchWithTimeout'

interface UseCacheOptions {
  ttlMs?: number // Time to live in milliseconds (default 5 minutes)
  bypassCache?: boolean // Skip cache and force fresh request
}

interface CachedFetchOptions extends RequestInit {
  ttlMs?: number
  bypassCache?: boolean
}

/**
 * Hook for making cached fetch requests
 * 
 * Features:
 * - Automatic response caching with TTL
 * - Request deduplication (in-flight requests share same promise)
 * - Manual cache invalidation
 * - Cache statistics tracking
 * 
 * @example
 * const { cachedFetch, invalidateCache, getCacheStats } = useCache()
 * 
 * // Make cached GET request (5 minute TTL by default)
 * const data = await cachedFetch('/api/admin/languages')
 * 
 * // Invalidate specific cache entry
 * await invalidateCache('/api/admin/languages')
 * 
 * // Make request with custom TTL
 * const data = await cachedFetch('/api/admin/languages', {
 *   ttlMs: 10 * 60 * 1000 // 10 minutes
 * })
 * 
 * // Skip cache and force fresh request
 * const data = await cachedFetch('/api/admin/languages', {
 *   bypassCache: true
 * })
 */
export function useCache() {
  const { fetchWithTimeout } = useFetchWithTimeout()
  /**
   * Make a cached fetch request
   */
  const cachedFetch = useCallback(async <T = any>(
    url: string,
    options: CachedFetchOptions = {}
  ): Promise<T> => {
    const {
      ttlMs = 5 * 60 * 1000, // Default 5 minutes
      bypassCache = false,
      ...fetchOptions
    } = options

    // Use GET by default
    const method = (fetchOptions.method || 'GET').toUpperCase()
    const cacheKey = generateCacheKey(url)

    // Check cache for GET requests
    if (method === 'GET' && !bypassCache) {
      const cached = apiCache.get<T>(cacheKey)
      if (cached) {
        return cached
      }

      // Check for in-flight request deduplication
      const inFlight = apiCache.getInFlight<T>(cacheKey)
      if (inFlight) {
        return inFlight
      }
    }

    // Make the actual request (with timeout and standardized errors)
    const fetchPromise = (async () => {
      const result = await fetchWithTimeout<T>(url, {
        ...fetchOptions,
        method,
      })
      if (!result.ok) {
        throw new Error(result.error || 'Request failed')
      }
      return result.data as T
    })()

    // Track in-flight request for deduplication
    if (method === 'GET' && !bypassCache) {
      const deduplicatedPromise = apiCache.trackInFlight(cacheKey, fetchPromise)
      const result = await deduplicatedPromise
      
      // Cache the successful response
      apiCache.set(cacheKey, result, ttlMs)
      return result
    }

    // Non-GET requests (POST, PUT, DELETE) are not cached by default
    const result = await fetchPromise
    return result
  }, [fetchWithTimeout])

  /**
   * Invalidate cache for a specific URL pattern
   */
  const invalidateCache = useCallback((urlPattern: string | RegExp) => {
    if (typeof urlPattern === 'string') {
      const cacheKey = generateCacheKey(urlPattern)
      apiCache.delete(cacheKey)
    } else {
      apiCache.deletePattern(urlPattern)
    }
  }, [])

  /**
   * Invalidate cache for a set of URLs
   */
  const invalidateCacheMultiple = useCallback((urlPatterns: (string | RegExp)[]) => {
    urlPatterns.forEach((pattern) => {
      if (typeof pattern === 'string') {
        const cacheKey = generateCacheKey(pattern)
        apiCache.delete(cacheKey)
      } else {
        apiCache.deletePattern(pattern)
      }
    })
  }, [])

  /**
   * Clear all cache
   */
  const clearCache = useCallback(() => {
    apiCache.clear()
  }, [])

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return apiCache.getStats()
  }, [])

  /**
   * Reset cache statistics
   */
  const resetCacheStats = useCallback(() => {
    apiCache.resetStats()
  }, [])

  return {
    cachedFetch,
    invalidateCache,
    invalidateCacheMultiple,
    clearCache,
    getCacheStats,
    resetCacheStats,
  }
}

/**
 * Helper function to invalidate language-related caches
 * (call this after language mutations)
 */
export function invalidateLanguageCaches() {
  apiCache.deletePattern(/\/api\/admin\/(languages|org-settings|regional-formats)/)
}

/**
 * Helper function to invalidate crowdin-related caches
 * (call this after crowdin mutations)
 */
export function invalidateCrowdinCaches() {
  apiCache.deletePattern(/\/api\/admin\/crowdin-integration/)
}

/**
 * Helper function to invalidate translation-related caches
 * (call this after translation mutations)
 */
export function invalidateTranslationCaches() {
  apiCache.deletePattern(/\/api\/admin\/translations/)
}
