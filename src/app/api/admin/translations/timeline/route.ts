import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface TimelineEntry {
  date: string
  totalKeys: number
  coverage: {
    en: number
    ar: number
    hi: number
  }
}

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '90', 10)

    // Generate timeline data for the specified period
    const timeline: TimelineEntry[] = []
    const now = new Date()

    for (let i = days; i > 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Simulate gradual translation progress
      const progress = (days - i) / days
      const baseKeys = 1000
      const keys = Math.round(baseKeys * (0.8 + progress * 0.2))

      timeline.push({
        date: dateStr,
        totalKeys: keys,
        coverage: {
          en: 100,
          ar: Math.round(70 + progress * 24), // 70% → 94%
          hi: Math.round(60 + progress * 27), // 60% → 87%
        },
      })
    }

    // Calculate statistics
    const latestEntry = timeline[timeline.length - 1]
    const firstEntry = timeline[0]

    const stats = {
      keysAdded: latestEntry.totalKeys - firstEntry.totalKeys,
      enCoverageChange: latestEntry.coverage.en - firstEntry.coverage.en,
      arCoverageChange: latestEntry.coverage.ar - firstEntry.coverage.ar,
      hiCoverageChange: latestEntry.coverage.hi - firstEntry.coverage.hi,
    }

    return Response.json({
      success: true,
      data: {
        timeline,
        stats,
        period: {
          startDate: firstEntry.date,
          endDate: latestEntry.date,
          days,
        },
      },
    })
  } catch (error: any) {
    console.error('Failed to get translation timeline:', error)
    return Response.json({ error: error.message || 'Failed to get translation timeline' }, { status: 500 })
  }
})
