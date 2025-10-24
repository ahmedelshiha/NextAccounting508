import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface VelocityMetric {
  language: string
  keysTranslatedToday: number
  keysTranslatedThisWeek: number
  keysTranslatedThisMonth: number
  averageKeysPerDay: number
  trend: 'increasing' | 'stable' | 'decreasing'
}

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30', 10)
    const language = url.searchParams.get('language') || null

    // Simulate velocity metrics
    const velocityData: VelocityMetric[] = [
      {
        language: 'ar',
        keysTranslatedToday: 12,
        keysTranslatedThisWeek: 67,
        keysTranslatedThisMonth: 245,
        averageKeysPerDay: 8.2,
        trend: 'increasing',
      },
      {
        language: 'hi',
        keysTranslatedToday: 9,
        keysTranslatedThisWeek: 42,
        keysTranslatedThisMonth: 178,
        averageKeysPerDay: 5.9,
        trend: 'stable',
      },
      {
        language: 'fr',
        keysTranslatedToday: 15,
        keysTranslatedThisWeek: 89,
        keysTranslatedThisMonth: 312,
        averageKeysPerDay: 10.4,
        trend: 'increasing',
      },
    ]

    // Filter by language if specified
    const data = language
      ? velocityData.filter(v => v.language === language)
      : velocityData

    // Calculate overall metrics
    const totalKeysTranslated = data.reduce((sum, v) => sum + v.keysTranslatedThisMonth, 0)
    const averageVelocity = data.length > 0
      ? (data.reduce((sum, v) => sum + v.averageKeysPerDay, 0) / data.length).toFixed(1)
      : 0

    // Generate daily velocity chart data
    const dailyVelocity = []
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date()
      date.setDate(date.getDate() - (30 - i))
      const baseVelocity = Math.round(20 + Math.random() * 15)
      dailyVelocity.push({
        date: date.toISOString().split('T')[0],
        keysTranslated: baseVelocity,
      })
    }

    return Response.json({
      success: true,
      data: {
        byLanguage: data,
        summary: {
          totalKeysTranslatedThisMonth: totalKeysTranslated,
          averageVelocityPerDay: parseFloat(averageVelocity as string),
          fastestLanguage: data.reduce((prev, current) =>
            current.averageKeysPerDay > prev.averageKeysPerDay ? current : prev
          ),
          period: `Last ${days} days`,
        },
        dailyVelocity,
      },
    })
  } catch (error: any) {
    console.error('Failed to get translation velocity:', error)
    return Response.json({ error: error.message || 'Failed to get translation velocity' }, { status: 500 })
  }
})
