import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = tenantFilter()

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
}
