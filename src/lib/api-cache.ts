/**
 * API Response Caching Middleware
 * 
 * Provides caching middleware for heavy read endpoints including:
 * - Bookings lists and analytics
 * - Services data and stats  
 * - Analytics dashboard data
 * - Calendar aggregations
 * - Report generation
 * 
 * Features:
 * - Intelligent cache invalidation on data changes
 * - Tenant-aware caching
 * - Configurable TTL per endpoint type
 * - Cache warming and precomputation
 * - Stale-while-revalidate pattern
 */

import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from './cache.service'
import { getTenantFromRequest } from './tenant'
import { captureErrorIfAvailable } from './observability-helpers'

const cache = new CacheService()

// Cache configuration per endpoint type
const CACHE_CONFIG = {
  // Read-heavy endpoints with longer TTL
  'bookings-list': { ttl: 300, staleWhileRevalidate: 600 }, // 5min fresh, 10min stale
  'services-list': { ttl: 900, staleWhileRevalidate: 1800 }, // 15min fresh, 30min stale
  'analytics-dashboard': { ttl: 180, staleWhileRevalidate: 360 }, // 3min fresh, 6min stale
  'calendar-data': { ttl: 120, staleWhileRevalidate: 300 }, // 2min fresh, 5min stale
  'reports-data': { ttl: 600, staleWhileRevalidate: 1200 }, // 10min fresh, 20min stale
  
  // Frequently changing data with shorter TTL
  'service-requests-list': { ttl: 60, staleWhileRevalidate: 180 }, // 1min fresh, 3min stale
  'tasks-list': { ttl: 30, staleWhileRevalidate: 120 }, // 30s fresh, 2min stale
  'realtime-stats': { ttl: 10, staleWhileRevalidate: 30 }, // 10s fresh, 30s stale
  
  // Slow-changing reference data with long TTL
  'team-members': { ttl: 1800, staleWhileRevalidate: 3600 }, // 30min fresh, 60min stale
  'currencies': { ttl: 3600, staleWhileRevalidate: 7200 }, // 60min fresh, 120min stale
  'settings': { ttl: 600, staleWhileRevalidate: 1200 }, // 10min fresh, 20min stale
}

export interface CacheOptions {
  key: string
  ttl?: number
  staleWhileRevalidate?: number
  tenantAware?: boolean
  invalidateOnEvents?: string[]
  skipCache?: boolean
}

export interface CachedResponse<T = any> {
  data: T
  cached: boolean
  stale: boolean
  timestamp: number
  cacheKey: string
}

/**
 * Generate cache key with tenant awareness and parameter hashing
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, any> = {},
  tenantId?: string | null
): string {
  // Create deterministic hash of parameters
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(String(params[key]))}`)
    .join('&')
  
  const paramHash = paramString ? `:${btoa(paramString).slice(0, 16)}` : ''
  const tenantPrefix = tenantId ? `t:${tenantId}:` : ''
  
  return `api:${tenantPrefix}${endpoint}${paramHash}`
}

/**
 * Cache middleware wrapper for API routes
 */
export function withCache<T = any>(
  options: CacheOptions,
  handler: (req: NextRequest) => Promise<T>
) {
  return async (req: NextRequest): Promise<NextResponse<CachedResponse<T>>> => {
    if (options.skipCache || process.env.DISABLE_API_CACHE === 'true') {
      const data = await handler(req)
      return NextResponse.json({
        data,
        cached: false,
        stale: false,
        timestamp: Date.now(),
        cacheKey: options.key
      })
    }

    const tenantId = options.tenantAware ? getTenantFromRequest(req as any) : null
    
    // Generate cache key from URL parameters
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const cacheKey = generateCacheKey(options.key, params, tenantId)
    
    const config = CACHE_CONFIG[options.key as keyof typeof CACHE_CONFIG] || {
      ttl: options.ttl || 300,
      staleWhileRevalidate: options.staleWhileRevalidate || 600
    }

    try {
      // Try to get cached response
      const cached = await cache.get<{
        data: T
        timestamp: number
        maxAge: number
        staleUntil: number
      }>(cacheKey)

      const now = Date.now()
      
      if (cached) {
        const isStale = now > cached.staleUntil
        const isExpired = now > (cached.timestamp + cached.maxAge * 1000)
        
        // Return cached data if not expired
        if (!isExpired) {
          // Trigger background revalidation if stale
          if (isStale) {
            // Fire and forget background refresh
            setImmediate(async () => {
              try {
                const freshData = await handler(req)
                await setCachedResponse(cacheKey, freshData, config.ttl, config.staleWhileRevalidate)
              } catch (error) {
                await captureErrorIfAvailable(error, { 
                  context: 'cache-background-revalidation',
                  cacheKey,
                  endpoint: options.key
                })
              }
            })
          }
          
          return NextResponse.json({
            data: cached.data,
            cached: true,
            stale: isStale,
            timestamp: cached.timestamp,
            cacheKey
          })
        }
      }

      // Cache miss or expired - fetch fresh data
      const freshData = await handler(req)
      
      // Cache the response
      await setCachedResponse(cacheKey, freshData, config.ttl, config.staleWhileRevalidate)
      
      return NextResponse.json({
        data: freshData,
        cached: false,
        stale: false,
        timestamp: now,
        cacheKey
      })
      
    } catch (error) {
      await captureErrorIfAvailable(error, { 
        context: 'api-cache-middleware',
        cacheKey,
        endpoint: options.key
      })
      
      // On error, try to return stale cache if available
      try {
        const staleCache = await cache.get<{
          data: T
          timestamp: number
        }>(cacheKey)
        
        if (staleCache) {
          return NextResponse.json({
            data: staleCache.data,
            cached: true,
            stale: true,
            timestamp: staleCache.timestamp,
            cacheKey
          })
        }
      } catch (staleError) {
        // Ignore stale cache errors
      }
      
      // If no cache available, re-throw original error
      throw error
    }
  }
}

/**
 * Store response in cache with TTL and stale-while-revalidate
 */
async function setCachedResponse<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  staleWhileRevalidateSeconds: number
): Promise<void> {
  const now = Date.now()
  const cacheData = {
    data,
    timestamp: now,
    maxAge: ttlSeconds,
    staleUntil: now + ttlSeconds * 1000
  }
  
  // Store with the longer stale period as TTL
  await cache.set(key, cacheData, staleWhileRevalidateSeconds)
}

/**
 * Invalidate cache for specific patterns
 */
export async function invalidateCache(patterns: string[]): Promise<void> {
  try {
    for (const pattern of patterns) {
      await cache.deletePattern(`api:*${pattern}*`)
    }
  } catch (error) {
    await captureErrorIfAvailable(error, { 
      context: 'cache-invalidation',
      patterns
    })
  }
}

/**
 * Invalidate cache by tenant
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  try {
    await cache.deletePattern(`api:t:${tenantId}:*`)
  } catch (error) {
    await captureErrorIfAvailable(error, { 
      context: 'tenant-cache-invalidation',
      tenantId
    })
  }
}

/**
 * Cache warming for frequently accessed endpoints
 */
export async function warmCache(
  endpoint: string,
  commonParams: Array<Record<string, any>> = [{}],
  tenantId?: string
): Promise<void> {
  try {
    for (const params of commonParams) {
      const cacheKey = generateCacheKey(endpoint, params, tenantId)
      
      // Only warm if not already cached
      const existing = await cache.get(cacheKey)
      if (!existing) {
        // This would need to be implemented per endpoint
        console.log(`Cache warming needed for ${cacheKey}`)
      }
    }
  } catch (error) {
    await captureErrorIfAvailable(error, { 
      context: 'cache-warming',
      endpoint,
      tenantId
    })
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
  keys: number
  estimatedSize: string
  hitRate?: number
}> {
  // This would need Redis-specific implementation for full stats
  return {
    keys: 0,
    estimatedSize: 'unknown',
    hitRate: undefined
  }
}

/**
 * Cache invalidation events mapping
 */
export const CACHE_INVALIDATION_EVENTS = {
  // Booking changes invalidate booking lists and analytics
  'BOOKING_CHANGED': ['admin-bookings', 'analytics-dashboard', 'admin-calendar'],
  'booking-created': ['admin-bookings', 'analytics-dashboard', 'admin-calendar'],
  'booking-updated': ['admin-bookings', 'analytics-dashboard', 'admin-calendar'],
  'booking-deleted': ['admin-bookings', 'analytics-dashboard', 'admin-calendar'],
  
  // Service changes invalidate service lists and related analytics
  'SERVICE_CHANGED': ['admin-services', 'analytics-dashboard'],
  'service-created': ['admin-services', 'analytics-dashboard'],
  'service-updated': ['admin-services', 'analytics-dashboard'],
  'service-deleted': ['admin-services', 'analytics-dashboard'],
  
  // Task changes invalidate task lists and analytics
  'TASK_CHANGED': ['admin-calendar', 'analytics-dashboard'],
  'task-created': ['admin-calendar', 'analytics-dashboard'],
  'task-updated': ['admin-calendar', 'analytics-dashboard'],
  'task-completed': ['admin-calendar', 'analytics-dashboard'],
  
  // Availability changes
  'AVAILABILITY_CHANGED': ['admin-calendar'],
  
  // Analytics changes
  'ANALYTICS_CHANGED': ['analytics-dashboard'],
  
  // User changes
  'USER_CHANGED': ['analytics-dashboard'],
  
  // Global cache clear
  'CACHE_CLEAR_ALL': ['*']
} as const

export type InvalidationEvent = keyof typeof CACHE_INVALIDATION_EVENTS

/**
 * Handle cache invalidation based on events
 */
export async function handleCacheInvalidation(
  event: keyof typeof CACHE_INVALIDATION_EVENTS,
  tenantId?: string
): Promise<void> {
  const patterns = CACHE_INVALIDATION_EVENTS[event]
  if (patterns && patterns.length > 0) {
    // Convert readonly array to mutable array
    await invalidateCache([...patterns])
    
    // Also invalidate tenant-specific cache if applicable
    if (tenantId) {
      for (const pattern of patterns) {
        await cache.deletePattern(`api:t:${tenantId}:${pattern}*`)
      }
    }
  }
}