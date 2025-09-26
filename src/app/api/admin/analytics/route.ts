import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface AnalyticsData {
  performance: {
    averageLoadTime: number
    averageNavigationTime: number
    errorRate: number
    activeUsers: number
  }
  userBehavior: {
    totalSessions: number
    averageSessionDuration: number
    bounceRate: number
    mostUsedFeatures: Array<{ name: string; count: number }>
  }
  systemHealth: {
    uptime: number
    memoryUsage: number
    responseTime: number
    status: 'healthy' | 'warning' | 'error'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization - only admin and team leads can access analytics
    const role = (session.user as any)?.role as string | undefined
    if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '24h'

    // Generate analytics data based on time range
    const analyticsData: AnalyticsData = await generateAnalyticsData(timeRange)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * Generate analytics data based on time range
 * In production, this would query actual database/analytics data
 */
async function generateAnalyticsData(timeRange: string): Promise<AnalyticsData> {
  // Simulate different performance based on time range
  const timeMultiplier = getTimeMultiplier(timeRange)
  const baseTime = Date.now()
  
  // Simulate realistic performance metrics with some variation
  const performanceVariation = Math.random() * 0.2 + 0.9 // 90-110% of base
  
  return {
    performance: {
      averageLoadTime: Math.round(1800 * performanceVariation * timeMultiplier),
      averageNavigationTime: Math.round(320 * performanceVariation * timeMultiplier),
      errorRate: Math.max(0, (0.008 + (Math.random() - 0.5) * 0.004)),
      activeUsers: Math.floor((24 + Math.random() * 16) * timeMultiplier)
    },
    userBehavior: {
      totalSessions: Math.floor((156 + Math.random() * 80) * timeMultiplier),
      averageSessionDuration: 12.5 + (Math.random() - 0.5) * 4,
      bounceRate: Math.max(0.05, Math.min(0.25, 0.15 + (Math.random() - 0.5) * 0.1)),
      mostUsedFeatures: generateFeatureUsage(timeRange)
    },
    systemHealth: {
      uptime: Math.max(99.0, 99.97 - Math.random() * 0.5),
      memoryUsage: Math.max(45, Math.min(95, 68.5 + (Math.random() - 0.5) * 20)),
      responseTime: Math.round(145 + (Math.random() - 0.5) * 50),
      status: determineSystemStatus()
    }
  }
}

/**
 * Get time multiplier for different ranges
 */
function getTimeMultiplier(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 0.1
    case '24h': return 1.0
    case '7d': return 7.0
    case '30d': return 30.0
    default: return 1.0
  }
}

/**
 * Generate feature usage data
 */
function generateFeatureUsage(timeRange: string): Array<{ name: string; count: number }> {
  const baseFeatures = [
    { name: 'Service Requests', baseCount: 89 },
    { name: 'Client Management', baseCount: 67 },
    { name: 'Bookings', baseCount: 54 },
    { name: 'Analytics Dashboard', baseCount: 32 },
    { name: 'Settings', baseCount: 18 },
    { name: 'Reports', baseCount: 28 },
    { name: 'Team Management', baseCount: 15 }
  ]

  const multiplier = getTimeMultiplier(timeRange)
  
  return baseFeatures
    .map(feature => ({
      name: feature.name,
      count: Math.floor(feature.baseCount * multiplier * (0.8 + Math.random() * 0.4))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 features
}

/**
 * Determine system status based on current conditions
 */
function determineSystemStatus(): 'healthy' | 'warning' | 'error' {
  const random = Math.random()
  
  // 85% healthy, 12% warning, 3% error
  if (random < 0.85) return 'healthy'
  if (random < 0.97) return 'warning'
  return 'error'
}

// Support only GET method
export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed - Use GET to fetch analytics data' 
  }, { status: 405 })
}