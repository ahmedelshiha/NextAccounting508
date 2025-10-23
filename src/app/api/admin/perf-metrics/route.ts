import { NextRequest, NextResponse } from 'next/server'
interface PerformanceMetricPayload {
  ts: number           // timestamp 
  path: string         // pathname
  userAgent: string
  type: string         // metric type (sample, final)
  metrics?: Record<string, any>
  [key: string]: any
}

const _api_POST = async (request: NextRequest) => {
  try {
    // Parse the performance metric data (accept anonymous submissions to avoid expensive auth checks)
    let payload: PerformanceMetricPayload

    try {
      payload = await request.json()
    } catch {
      // sendBeacon sends data as blob/text; try parsing as text first
      try {
        const text = await request.text()
        payload = JSON.parse(text)
      } catch {
        return NextResponse.json({
          error: 'Invalid request body - must be valid JSON'
        }, { status: 400 })
      }
    }

    // Basic validation - require at least type or ts+path for meaningful data
    // Allow flexibility for different payload structures (perf metrics, realtime telemetry, etc.)
    const hasMinimalMetrics = payload.type && (payload.metrics || payload.ts)
    const hasMinimalTelemetry = payload.ts && payload.path && payload.type

    if (!hasMinimalMetrics && !hasMinimalTelemetry) {
      return NextResponse.json({
        error: 'Invalid metric data - must include type and either metrics or (ts and path)'
      }, { status: 400 })
    }

    // Provide defaults for optional fields
    const normalizedPayload = {
      ...payload,
      ts: payload.ts ?? Date.now(),
      path: payload.path ?? 'unknown',
      userAgent: payload.userAgent ?? 'unknown',
      type: payload.type ?? 'unknown',
    }

    // In development, just log the metrics
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Admin Performance Metric:', {
        type: normalizedPayload.type,
        path: normalizedPayload.path,
        metrics: normalizedPayload.metrics,
        timestamp: new Date(normalizedPayload.ts).toISOString(),
        userAgent: normalizedPayload.userAgent?.substring(0, 50),
      })
    }

    // In production, you could:
    // 1. Store in database for analytics
    // 2. Send to external analytics service (DataDog, New Relic, etc.)
    // 3. Log to monitoring system

    // For now, just acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Performance metric received'
    })

  } catch (error) {
    console.error('Error processing performance metric:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
// Only POST method is supported
const _api_GET = async () => {
  return NextResponse.json({
    error: 'Method not allowed - Use POST to send metrics'
  }, { status: 405 })
}

export const POST = withTenantContext(_api_POST, { requireAuth: false })
export const GET = withTenantContext(_api_GET, { requireAuth: false })
