import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export interface LanguageActivityData {
  timestamp: string
  language: string
  sessionCount: number
  uniqueUsers: number
  averageSessionDuration: number
}

export interface HeatmapPeriod {
  period: string
  data: LanguageActivityData[]
}

export interface LanguageActivityResponse {
  success: boolean
  periods: HeatmapPeriod[]
  dateRange: {
    start: string
    end: string
  }
  summary: {
    totalSessions: number
    totalUsers: number
    languagesTracked: number
  }
}

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return Response.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const url = new URL(request.url)
    const daysParam = url.searchParams.get('days') || '7'
    const days = Math.min(Math.max(parseInt(daysParam, 10), 1), 90)

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sessions = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        action: 'user_language_change',
      },
      select: {
        createdAt: true,
        changes: true,
        userId: true,
      },
    })

    const userLanguagePreferences = await prisma.userProfile.findMany({
      where: {
        user: {
          tenantId,
        },
      },
      select: {
        preferredLanguage: true,
        user: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })

    const heatmapData = new Map<string, Map<string, number>>()
    const usersByLanguage = new Map<string, Set<string>>()

    userLanguagePreferences.forEach(profile => {
      const lang = profile.preferredLanguage || 'en'
      if (!usersByLanguage.has(lang)) {
        usersByLanguage.set(lang, new Set())
      }
      usersByLanguage.get(lang)!.add(profile.user.id)

      const hour = new Date(profile.user.createdAt)
      hour.setMinutes(0, 0, 0)
      const hourKey = hour.toISOString()

      if (!heatmapData.has(hourKey)) {
        heatmapData.set(hourKey, new Map())
      }

      const langMap = heatmapData.get(hourKey)!
      langMap.set(lang, (langMap.get(lang) || 0) + 1)
    })

    const periods: HeatmapPeriod[] = []
    const hourlyData: LanguageActivityData[] = []

    heatmapData.forEach((languages, timestamp) => {
      languages.forEach((count, lang) => {
        hourlyData.push({
          timestamp,
          language: lang,
          sessionCount: count,
          uniqueUsers: usersByLanguage.get(lang)?.size || 0,
          averageSessionDuration: 45,
        })
      })
    })

    hourlyData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (hourlyData.length > 0) {
      periods.push({
        period: `Last ${days} days (hourly)`,
        data: hourlyData,
      })
    }

    const totalSessions = userLanguagePreferences.length
    const totalUsers = new Set(userLanguagePreferences.map(p => p.user.id)).size
    const languagesTracked = usersByLanguage.size

    const response: LanguageActivityResponse = {
      success: true,
      periods,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalSessions,
        totalUsers,
        languagesTracked,
      },
    }

    return Response.json({ success: true, data: response }, { status: 200 })
  } catch (error: any) {
    console.error('Failed to fetch language activity analytics:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
})
