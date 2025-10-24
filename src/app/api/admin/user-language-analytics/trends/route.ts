import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = Math.min(parseInt(searchParams.get('days') || '90'), 365)

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return Response.json({ error: 'Tenant context required' }, { status: 400 })
    }

    // Compute since date (UTC midnight)
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setUTCHours(0, 0, 0, 0)

    const metrics = await prisma.translationMetrics.findMany({
      where: { tenantId, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        usersWithEnglish: true,
        usersWithArabic: true,
        usersWithHindi: true,
      },
    })

    const labels: string[] = []
    const series = {
      en: [] as number[],
      ar: [] as number[],
      hi: [] as number[],
      total: [] as number[],
    }

    for (const m of metrics) {
      const d = new Date(m.date)
      labels.push(d.toISOString().split('T')[0])
      const en = Number(m.usersWithEnglish || 0)
      const ar = Number(m.usersWithArabic || 0)
      const hi = Number(m.usersWithHindi || 0)
      series.en.push(en)
      series.ar.push(ar)
      series.hi.push(hi)
      series.total.push(en + ar + hi)
    }

    const latestIdx = labels.length - 1
    const prevIdx = Math.max(0, latestIdx - 1)
    const summary = labels.length
      ? {
          current: {
            date: labels[latestIdx],
            en: series.en[latestIdx],
            ar: series.ar[latestIdx],
            hi: series.hi[latestIdx],
            total: series.total[latestIdx],
          },
          previous: {
            date: labels[prevIdx],
            en: series.en[prevIdx],
            ar: series.ar[prevIdx],
            hi: series.hi[prevIdx],
            total: series.total[prevIdx],
          },
          delta: {
            en: series.en[latestIdx] - series.en[prevIdx],
            ar: series.ar[latestIdx] - series.ar[prevIdx],
            hi: series.hi[latestIdx] - series.hi[prevIdx],
            total: series.total[latestIdx] - series.total[prevIdx],
          },
        }
      : null

    return Response.json({
      success: true,
      data: {
        labels,
        series,
        summary,
      },
    })
  } catch (error: any) {
    console.error('Failed to get user language trends:', error)
    return Response.json({ error: error.message || 'Failed to get trends' }, { status: 500 })
  }
})
