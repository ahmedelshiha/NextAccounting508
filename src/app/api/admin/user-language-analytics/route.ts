import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return Response.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const users = await prisma.userProfile.findMany({
      where: {
        user: { tenantId },
      },
      select: {
        preferredLanguage: true,
      },
    })

    const languageCount: Record<string, number> = {}
    let totalUsers = 0

    for (const user of users) {
      const lang = user.preferredLanguage || 'en'
      languageCount[lang] = (languageCount[lang] || 0) + 1
      totalUsers++
    }

    const distribution = Object.entries(languageCount)
      .map(([language, count]) => ({
        language,
        count,
        percentage: totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : '0',
      }))
      .sort((a, b) => b.count - a.count)

    const languagesInUse = distribution.map(d => d.language)

    return Response.json({
      success: true,
      data: {
        totalUsers,
        languagesInUse,
        mostUsedLanguage: distribution[0]?.language || 'en',
        distribution,
      },
    })
  } catch (error: any) {
    console.error('Failed to get user language analytics:', error)
    return Response.json({ error: error.message || 'Failed to get analytics' }, { status: 500 })
  }
})
