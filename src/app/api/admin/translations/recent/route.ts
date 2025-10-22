import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

/**
 * GET /api/admin/translations/recent?days=7&limit=50
 * 
 * Returns recently added translation keys (last N days)
 * Query params:
 * - days: look back N days (default: 7)
 * - limit: max results (default: 50)
 */
export const GET = withTenantContext(async (request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 90)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)

    // Calculate date range
    const since = new Date()
    since.setDate(since.getDate() - days)

    const keys = await prisma.translationKey.findMany({
      where: {
        tenantId,
        addedAt: { gte: since },
      },
      select: {
        id: true,
        key: true,
        namespace: true,
        enTranslated: true,
        arTranslated: true,
        hiTranslated: true,
        addedAt: true,
        lastUpdated: true,
      },
      orderBy: { addedAt: 'desc' },
      take: limit,
    })

    // Calculate translation readiness
    const stats = {
      enNotTranslated: keys.filter(k => !k.enTranslated).length,
      arNotTranslated: keys.filter(k => !k.arTranslated).length,
      hiNotTranslated: keys.filter(k => !k.hiTranslated).length,
    }

    return NextResponse.json({
      period: {
        since: since.toISOString(),
        days,
      },
      count: keys.length,
      stats,
      keys,
    })
  } catch (error) {
    console.error('[translations/recent] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent translations' },
      { status: 500 }
    )
  }
})
