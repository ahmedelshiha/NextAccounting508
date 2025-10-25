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
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365)
    const tenantId = ctx.tenantId
    if (!tenantId) return Response.json({ error: 'Tenant context required' }, { status: 400 })

    const since = new Date()
    since.setDate(since.getDate() - days)

    const users = await prisma.userProfile.findMany({
      where: {
        user: { tenantId },
        createdAt: { gte: since },
      },
      select: { preferredLanguage: true },
    })

    const counts: Record<string, number> = {}
    for (const u of users) {
      const lang = u.preferredLanguage || 'en'
      counts[lang] = (counts[lang] || 0) + 1
    }

    return Response.json({ success: true, data: { since: since.toISOString(), days, counts, totalNewUsers: users.length } })
  } catch (error: any) {
    console.error('Failed to get new users analytics:', error)
    return Response.json({ error: error.message || 'Failed to get new users analytics' }, { status: 500 })
  }
})
