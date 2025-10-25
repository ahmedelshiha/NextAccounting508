import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

/**
 * GET /api/admin/translations/missing?language=ar&limit=50&offset=0
 * 
 * Returns list of untranslated keys for a specific language
 * Query params:
 * - language: en, ar, hi (required)
 * - limit: max results (default: 50)
 * - offset: pagination offset (default: 0)
 * - namespace: filter by namespace (optional)
 */
export const GET = withTenantContext(async (request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'ar'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const namespace = searchParams.get('namespace')

    if (!['en', 'ar', 'hi'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be en, ar, or hi' },
        { status: 400 }
      )
    }

    // Build where clause based on language
    const whereClause: any = { tenantId }
    
    if (namespace) {
      whereClause.namespace = namespace
    }

    // Find untranslated keys
    if (language === 'ar') {
      whereClause.arTranslated = false
    } else if (language === 'hi') {
      whereClause.hiTranslated = false
    } else {
      // English is baseline, show keys without translation
      whereClause.enTranslated = false
    }

    const [keys, total] = await Promise.all([
      prisma.translationKey.findMany({
        where: whereClause,
        select: {
          id: true,
          key: true,
          namespace: true,
          enTranslated: true,
          arTranslated: true,
          hiTranslated: true,
          addedAt: true,
        },
        orderBy: { addedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.translationKey.count({ where: whereClause }),
    ])

    return NextResponse.json({
      language,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
      keys,
    })
  } catch (error) {
    console.error('[translations/missing] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch missing translations' },
      { status: 500 }
    )
  }
})
