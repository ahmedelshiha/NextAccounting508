import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/auth/tenant'
import { requirePermission } from '@/lib/permissions'

/**
 * GET /api/admin/translations/status
 * 
 * Returns translation coverage stats for all languages
 * - Total keys per language
 * - Translated count per language
 * - Coverage percentage
 * - Recently added keys
 * - User distribution by language
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    await requirePermission('SETTINGS_LANGUAGES_MANAGE', request)

    // Get all translation keys for this tenant
    const allKeys = await prisma.translationKey.findMany({
      where: { tenantId },
    })

    // Get latest metrics snapshot
    const latestMetrics = await prisma.translationMetrics.findFirst({
      where: { tenantId },
      orderBy: { date: 'desc' },
    })

    // Get user distribution by language
    const usersByLanguage = await prisma.userProfile.groupBy({
      by: ['preferredLanguage'],
      where: { user: { tenantId } },
      _count: { preferredLanguage: true },
    })

    const userDistribution: Record<string, number> = {
      en: 0,
      ar: 0,
      hi: 0,
    }

    for (const group of usersByLanguage) {
      const lang = group.preferredLanguage || 'en'
      userDistribution[lang] = group._count.preferredLanguage
    }

    // Calculate coverage stats
    const enTotal = allKeys.length
    const enTranslated = allKeys.filter(k => k.enTranslated).length
    const arTranslated = allKeys.filter(k => k.arTranslated).length
    const hiTranslated = allKeys.filter(k => k.hiTranslated).length

    const stats = {
      timestamp: new Date().toISOString(),
      summary: {
        totalKeys: enTotal,
        enCoveragePct: enTotal > 0 ? ((enTranslated / enTotal) * 100).toFixed(1) : '0',
        arCoveragePct: enTotal > 0 ? ((arTranslated / enTotal) * 100).toFixed(1) : '0',
        hiCoveragePct: enTotal > 0 ? ((hiTranslated / enTotal) * 100).toFixed(1) : '0',
      },
      coverage: {
        en: { translated: enTranslated, total: enTotal, pct: enTranslated === enTotal ? 100 : 0 },
        ar: { translated: arTranslated, total: enTotal, pct: enTotal > 0 ? Math.round((arTranslated / enTotal) * 100) : 0 },
        hi: { translated: hiTranslated, total: enTotal, pct: enTotal > 0 ? Math.round((hiTranslated / enTotal) * 100) : 0 },
      },
      userDistribution,
      latestMetrics: latestMetrics ? {
        date: latestMetrics.date,
        enCoveragePct: latestMetrics.enCoveragePct.toNumber(),
        arCoveragePct: latestMetrics.arCoveragePct.toNumber(),
        hiCoveragePct: latestMetrics.hiCoveragePct.toNumber(),
      } : null,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[translations/status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translation status' },
      { status: 500 }
    )
  }
}
