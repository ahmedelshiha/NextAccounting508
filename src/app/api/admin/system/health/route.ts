/**
 * Health Check API Endpoint
 * 
 * GET /api/admin/system/health
 * 
 * Server-side health check endpoint that monitors:
 * - Database connectivity (Prisma)
 * - Redis cache (optional)
 * - API response time
 * 
 * Returns aggregated system health with individual service checks.
 */

import { NextResponse } from 'next/server'
import type { SystemHealthResponse } from '@/components/admin/layout/Footer/types'

/**
 * Helper to measure execution time
 */
function measureTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now()
  return fn()
    .then(() => performance.now() - start)
    .catch(() => {
      // Return elapsed time even on error
      return performance.now() - start
    })
}

/**
 * Check database connectivity via Prisma
 */
async function checkDatabase(): Promise<{
  status: 'operational' | 'degraded' | 'outage'
  latency: number
  error?: string
}> {
  let latency = 0
  let status: 'operational' | 'degraded' | 'outage' = 'outage'
  let error: string | undefined

  try {
    latency = await measureTime(async () => {
      try {
        // Using raw SQL for minimal overhead
        const prisma = (await import('@prisma/client')).PrismaClient
        const client = new prisma()
        
        // Simple connectivity check
        await client.$queryRaw`SELECT 1`
        
        await client.$disconnect()
      } catch (e) {
        throw e
      }
    })

    // Determine status based on latency
    if (latency < 1000) {
      status = 'operational'
    } else {
      status = 'degraded'
      error = `Database latency high: ${Math.round(latency)}ms`
    }
  } catch (e) {
    status = 'outage'
    error = e instanceof Error ? e.message : 'Database check failed'
  }

  return { status, latency, error }
}

/**
 * Check Redis connectivity (optional, graceful degradation)
 */
async function checkRedis(): Promise<{
  status: 'operational' | 'degraded' | 'outage'
  latency: number
  error?: string
} | null> {
  try {
    // Check if Redis is configured
    if (!process.env.REDIS_URL) {
      return null
    }

    let latency = 0
    let status: 'operational' | 'degraded' | 'outage' = 'outage'
    let error: string | undefined

    latency = await measureTime(async () => {
      try {
        const Redis = (await import('ioredis')).default
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
          maxRetriesPerRequest: 1,
          retryStrategy: () => null, // Don't retry
        })

        try {
          await redis.ping()
          status = 'operational'
        } finally {
          redis.disconnect()
        }
      } catch (e) {
        throw e
      }
    })

    // Determine status based on latency
    if (latency >= 500) {
      status = 'degraded'
      error = `Redis latency high: ${Math.round(latency)}ms`
    }

    return { status, latency, error }
  } catch (e) {
    // Non-critical, return degraded with warning
    return {
      status: 'degraded',
      latency: 0,
      error: e instanceof Error ? e.message : 'Redis check failed',
    }
  }
}

/**
 * Check API responsiveness
 */
async function checkAPI(): Promise<{
  status: 'operational' | 'degraded' | 'outage'
  latency: number
  error?: string
}> {
  let latency = 0
  let status: 'operational' | 'degraded' | 'outage' = 'operational'

  try {
    latency = await measureTime(async () => {
      // API check is just measuring response time of this check itself
      // In a real scenario, you'd call a real endpoint
      await new Promise(resolve => setTimeout(resolve, 0))
    })
  } catch (e) {
    status = 'outage'
  }

  return { status, latency }
}

/**
 * GET /api/admin/system/health
 * 
 * Returns system health status
 */
export async function GET(): Promise<NextResponse<SystemHealthResponse>> {
  const startTime = performance.now()

  try {
    // Run all checks in parallel with timeout protection
    const checksPromise = Promise.all([
      checkDatabase(),
      checkRedis(),
      checkAPI(),
    ])

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Health check timeout')),
        5000 // 5 second total timeout
      )
    })

    const [databaseCheck, redisCheck, apiCheck] = await Promise.race([
      checksPromise,
      timeoutPromise,
    ])

    // Aggregate results
    const checks: SystemHealthResponse['checks'] = {
      database: databaseCheck,
      api: apiCheck,
    }

    // Include Redis check if available
    if (redisCheck) {
      checks.redis = redisCheck
    }

    // Determine overall status
    // Critical services: database, api
    // Non-critical services: redis
    const criticalIssues = [
      databaseCheck.status === 'outage',
      apiCheck.status === 'outage',
    ].some(Boolean)

    const anyDegraded = [
      databaseCheck.status === 'degraded',
      apiCheck.status === 'degraded',
      redisCheck?.status === 'degraded',
    ].some(Boolean)

    let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    let message = 'All systems operational'

    if (criticalIssues) {
      overallStatus = 'outage'
      const failedServices = []
      if (databaseCheck.status === 'outage') failedServices.push('database')
      if (apiCheck.status === 'outage') failedServices.push('API')
      message = `Service unavailable: ${failedServices.join(', ')}`
    } else if (anyDegraded) {
      overallStatus = 'degraded'
      const slowServices = []
      if (databaseCheck.status === 'degraded') slowServices.push('database')
      if (apiCheck.status === 'degraded') slowServices.push('API')
      if (redisCheck?.status === 'degraded') slowServices.push('cache')
      message = `Service degraded: ${slowServices.join(', ')} experiencing high latency`
    }

    // Build response
    const response: SystemHealthResponse = {
      status: overallStatus,
      message,
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }

    // Return with appropriate cache headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    // Handle unexpected errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Return graceful error response
    const response: SystemHealthResponse = {
      status: 'outage',
      message: 'Unable to determine system status',
      checks: {
        database: {
          status: 'unknown',
          latency: 0,
          error: 'Check skipped due to error',
        },
        api: {
          status: 'unknown',
          latency: 0,
          error: 'Check skipped due to error',
        },
      },
      timestamp: new Date().toISOString(),
    }

    // Log error for monitoring
    console.error('[Health Check]', errorMessage)

    return NextResponse.json(response, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}
