import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { withSpan, captureError } from '@/lib/observability'

// In-memory buffer for posted samples (best-effort; not persisted).
const samples: Array<{ ts: number; path: string; metrics: Record<string, number | null> }> = []
const MAX_SAMPLES = 200

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In real setup, aggregate from Sentry/Lighthouse/Netlify builds
    const data = await withSpan('perf-metrics.snapshot', async () => ({
      pageLoad: { current: 1.2, previous: 1.8, trend: 'up' },
      apiResponse: { current: 245, previous: 310, trend: 'up' },
      uptime: { current: 99.8, previous: 99.2, trend: 'up' },
      errorRate: { current: 0.02, previous: 0.08, trend: 'up' },
      // Include the last N client-reported samples for ad-hoc inspection
      recent: samples.slice(-20)
    }))

    return NextResponse.json(data)
  } catch (error) {
    captureError(error, { tags: { route: 'admin.perf-metrics' } })
    console.error('Perf metrics API error:', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Accept anonymous admin-side client posts; sanitize input
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ ok: false }, { status: 400 })
    const ts = Number((body as any).ts) || Date.now()
    const path = String((body as any).path || '')
    const metrics = (body as any).metrics
    if (!path || typeof metrics !== 'object') return NextResponse.json({ ok: false }, { status: 400 })

    samples.push({ ts, path, metrics })
    if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Perf metrics POST error:', error)
    return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 })
  }
}
