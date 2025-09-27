import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface PerformanceMetricPayload {
  ts: number           // timestamp 
  path: string         // pathname
  userAgent: string
  type: string         // metric type (sample, final)
  metrics?: Record<string, any>
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the performance metric data
    const payload: PerformanceMetricPayload = await request.json()

    // Basic validation - accommodate actual payload structure
    if (!payload.ts || !payload.path || !payload.type) {
      return NextResponse.json({ 
        error: 'Invalid metric data - missing required fields (ts, path, type)' 
      }, { status: 400 })
    }

    // In development, just log the metrics
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Admin Performance Metric:', {
        type: payload.type,
        path: payload.path,
        metrics: payload.metrics,
        user: session.user.email,
        timestamp: new Date(payload.ts).toISOString(),
        userAgent: payload.userAgent
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

// Only POST method is supported
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed - Use POST to send metrics' 
  }, { status: 405 })
}