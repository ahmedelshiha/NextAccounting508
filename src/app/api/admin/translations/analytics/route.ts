import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/auth/tenant'
import { requirePermission } from '@/lib/permissions'

/**
 * GET /api/admin/translations/analytics?days=30
 * 
 * Returns historical translation metrics for trending analysis
 * Query params:
 * - days: look back N days (default: 30, max: 365)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    await requirePermission('SETTINGS_LANGUAGES_MANAGE', request)

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365)

    // Calculate date range
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setUTCHours(0, 0, 0, 0)

    // Fetch metrics for the period
    const metrics = await prisma.translationMetrics.findMany({
      where: {
        tenantId,
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
    })

    // Transform for charting
    const chartData = metrics.map(m => ({
      date: m.date.toISOString().split('T')[0], // YYYY-MM-DD
      en: parseFloat(m.enCoveragePct.toString()),
      ar: parseFloat(m.arCoveragePct.toString()),
      hi: parseFloat(m.hiCoveragePct.toString()),
      totalKeys: m.totalUniqueKeys,
    }))

    // Calculate summary stats
    const latest = metrics[metrics.length - 1]
    const earliest = metrics[0]

    const summary = {
      period: { since, days },
      dataPoints: metrics.length,
      current: latest ? {
        date: latest.date.toISOString().split('T')[0],
        en: parseFloat(latest.enCoveragePct.toString()),
        ar: parseFloat(latest.arCoveragePct.toString()),
        hi: parseFloat(latest.hiCoveragePct.toString()),
      } : null,
      previous: earliest ? {
        date: earliest.date.toISOString().split('T')[0],
        en: parseFloat(earliest.enCoveragePct.toString()),
        ar: parseFloat(earliest.arCoveragePct.toString()),
        hi: parseFloat(earliest.hiCoveragePct.toString()),
      } : null,
      trend: latest && earliest ? {
        en: parseFloat(latest.enCoveragePct.toString()) - parseFloat(earliest.enCoveragePct.toString()),
        ar: parseFloat(latest.arCoveragePct.toString()) - parseFloat(earliest.arCoveragePct.toString()),
        hi: parseFloat(latest.hiCoveragePct.toString()) - parseFloat(earliest.hiCoveragePct.toString()),
      } : null,
    }

    return NextResponse.json({
      summary,
      chartData,
    })
  } catch (error) {
    console.error('[translations/analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translation analytics' },
      { status: 500 }
    )
  }
}
