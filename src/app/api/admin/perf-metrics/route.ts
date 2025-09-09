import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In real setup, aggregate from Sentry/Lighthouse/Netlify builds
    const data = {
      pageLoad: { current: 1.2, previous: 1.8, trend: 'up' },
      apiResponse: { current: 245, previous: 310, trend: 'up' },
      uptime: { current: 99.8, previous: 99.2, trend: 'up' },
      errorRate: { current: 0.02, previous: 0.08, trend: 'up' }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Perf metrics API error:', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
