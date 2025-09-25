import { NextRequest, NextResponse } from 'next/server'

// In-memory buffer for posted samples (best-effort; not persisted).
const samples: Array<{ ts: number; path: string; metrics: Record<string, number | null> }> = []
const MAX_SAMPLES = 200

// Web vitals and timing thresholds (ms unless noted)
const THRESHOLDS = {
  lcp: 2500, // good < 2500ms
  cls: 0.1,  // good < 0.1
  inp: 200,  // good < 200ms
  ttfb: 600, // acceptable < 600ms
  fcp: 1800, // acceptable < 1800ms
  domInteractive: 4000,
  load: 6000,
  uptimeMin: 99.0,    // %
  errorRateMax: 0.05, // 5%
} as const

export async function GET(_request: NextRequest) {
  try {
    const [{ getServerSession }, { authOptions }] = await Promise.all([
      import('next-auth/next'),
      import('@/lib/auth'),
    ])
    const [{ hasPermission, PERMISSIONS }] = await Promise.all([
      import('@/lib/permissions'),
    ])
    const { withSpan, captureError } = await import('@/lib/observability')
    const { PerfMetricsGetResponseSchema } = await import('@/schemas/admin/perf-metrics')

    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In real setup, aggregate from Sentry/Lighthouse/Netlify builds
    const data = await withSpan('perf-metrics.snapshot', async () => {
      const recent = samples.slice(-50)

      // Compute simple alerting over recent client samples
      const counts = { total: recent.length, lcp: 0, cls: 0, inp: 0, ttfb: 0, fcp: 0, domInteractive: 0, load: 0 }
      for (const s of recent) {
        const m = s.metrics || {}
        if (m.lcp != null && m.lcp > THRESHOLDS.lcp) counts.lcp++
        if (m.cls != null && m.cls > THRESHOLDS.cls) counts.cls++
        if (m.inp != null && m.inp > THRESHOLDS.inp) counts.inp++
        if (m.ttfb != null && m.ttfb > THRESHOLDS.ttfb) counts.ttfb++
        if (m.fcp != null && m.fcp > THRESHOLDS.fcp) counts.fcp++
        if (m.domInteractive != null && m.domInteractive > THRESHOLDS.domInteractive) counts.domInteractive++
        if (m.load != null && m.load > THRESHOLDS.load) counts.load++
      }

      const frac = (n: number) => (counts.total ? n / counts.total : 0)
      const alerts: Array<{ metric: string; threshold: number; fraction: number; count: number }> = []
      const pushIf = (metric: keyof typeof counts, threshold: number) => {
        const count = counts[metric]
        const fraction = frac(count)
        if (fraction >= 0.2) alerts.push({ metric, threshold, fraction, count })
      }
      pushIf('lcp', THRESHOLDS.lcp)
      pushIf('cls', THRESHOLDS.cls)
      pushIf('inp', THRESHOLDS.inp)
      pushIf('ttfb', THRESHOLDS.ttfb)
      pushIf('fcp', THRESHOLDS.fcp)
      pushIf('domInteractive', THRESHOLDS.domInteractive)
      pushIf('load', THRESHOLDS.load)

      return {
        pageLoad: { current: 1.2, previous: 1.8, trend: 'up' },
        apiResponse: { current: 245, previous: 310, trend: 'up' },
        uptime: { current: 99.8, previous: 99.2, trend: 'up' },
        errorRate: { current: 0.02, previous: 0.08, trend: 'up' },
        thresholds: THRESHOLDS,
        status: alerts.length > 0 ? 'alert' : 'ok',
        alerts,
        // Include the last N client-reported samples for ad-hoc inspection
        recent,
      }
    })

    const parsed = PerfMetricsGetResponseSchema.parse(data)
    return NextResponse.json(parsed)
  } catch (error) {
    const { captureError } = await import('@/lib/observability')
    captureError(error, { tags: { route: 'admin.perf-metrics' } })
    console.error('Perf metrics API error:', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Accept anonymous admin-side client posts; sanitize input
    const body = await request.json().catch(() => null)
    const { PerfMetricsPostSchema } = await import('@/schemas/admin/perf-metrics')
    const parsed = PerfMetricsPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
    const { ts, path, metrics } = parsed.data
    const tsFinal = ts ?? Date.now()

    samples.push({ ts: tsFinal, path, metrics })
    if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Perf metrics POST error:', error)
    return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 })
  }
}
