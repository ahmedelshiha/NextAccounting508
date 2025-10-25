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

function detectDeviceFromUA(ua?: string | null): string {
  if (!ua) return 'unknown'
  const u = ua.toLowerCase()
  if (/ipad|tablet/.test(u)) return 'tablet'
  if (/mobi|android|iphone/.test(u)) return 'mobile'
  return 'desktop'
}

function regionFromProfile(profile: any): string {
  // Prefer explicit country in metadata, fall back to timezone region (e.g., 'America')
  try {
    const meta = profile.metadata || {}
    if (meta && typeof meta === 'object') {
      if (meta.country) return String(meta.country).toLowerCase()
    }
    if (profile.timezone && typeof profile.timezone === 'string') {
      const parts = profile.timezone.split('/')
      if (parts.length > 0) return parts[0].toLowerCase()
    }
  } catch (e) {
    // ignore
  }
  return 'unknown'
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

    // Optional filters
    const languagesParam = url.searchParams.get('languages')
    const languagesFilter = languagesParam ? languagesParam.split(',').map(s => s.trim()).filter(Boolean) : null
    const deviceFilter = (url.searchParams.get('device') || 'all').toLowerCase()
    const regionFilter = (url.searchParams.get('region') || 'all').toLowerCase()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch audit logs for language change events in range (these provide activity)
    const auditLogs = await prisma.auditLog.findMany({
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
        metadata: true,
        userAgent: true,
        userId: true,
        // changes field may exist in metadata or changes depending on implementation
        // include metadata only and use that for language info if present
      },
    })

    // Collect userIds to fetch profiles for region info and fallback language
    const userIds = Array.from(new Set(auditLogs.map(a => a.userId).filter(Boolean)))

    const profiles = await prisma.userProfile.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        preferredLanguage: true,
        user: { select: { id: true, createdAt: true } },
        timezone: true,
        metadata: true,
      },
    })

    const profileByUserId = new Map<string, any>()
    profiles.forEach(p => profileByUserId.set(p.user.id, p))

    // Build heatmap from audit logs (hourly aggregation)
    const heatmapData = new Map<string, Map<string, number>>()
    const usersByLanguage = new Map<string, Set<string>>()

    function addEntry(ts: Date, lang: string, userId?: string | null) {
      const hour = new Date(ts)
      hour.setMinutes(0, 0, 0)
      const hourKey = hour.toISOString()

      if (!heatmapData.has(hourKey)) heatmapData.set(hourKey, new Map())
      const langMap = heatmapData.get(hourKey)!
      langMap.set(lang, (langMap.get(lang) || 0) + 1)

      if (userId) {
        if (!usersByLanguage.has(lang)) usersByLanguage.set(lang, new Set())
        usersByLanguage.get(lang)!.add(userId)
      }
    }

    // Process audit logs
    for (const a of auditLogs) {
      const ua = a.userAgent || (a.metadata && a.metadata.userAgent) || null
      const device = detectDeviceFromUA(ua)

      // Determine language change from metadata if available
      let lang: string | null = null
      try {
        if (a.metadata && typeof a.metadata === 'object') {
          // common shapes: { from: 'en', to: 'ar' } or { language: 'ar' }
          if (a.metadata.language) lang = String(a.metadata.language)
          else if (a.metadata.to) lang = String(a.metadata.to)
          else if (a.metadata.preferredLanguage) lang = String(a.metadata.preferredLanguage)
        }
      } catch (e) {
        lang = null
      }

      // fallback to user's profile preferredLanguage
      const profile = a.userId ? profileByUserId.get(a.userId) : null
      if (!lang && profile) lang = profile.preferredLanguage || null
      if (!lang) lang = 'en'

      // Apply filters: language/device/region
      if (languagesFilter && !languagesFilter.includes(lang)) continue
      if (deviceFilter !== 'all' && device !== deviceFilter) continue

      const region = profile ? regionFromProfile(profile) : 'unknown'
      if (regionFilter !== 'all' && region !== regionFilter) continue

      addEntry(new Date(a.createdAt), lang, a.userId || undefined)
    }

    // Additionally include snapshot of current user language preferences (as before) to ensure coverage
    const userLanguagePreferences = await prisma.userProfile.findMany({
      where: { user: { tenantId } },
      select: {
        preferredLanguage: true,
        user: { select: { id: true, createdAt: true } },
        timezone: true,
        metadata: true,
      },
    })

    for (const profile of userLanguagePreferences) {
      const lang = profile.preferredLanguage || 'en'
      // apply language filter
      if (languagesFilter && !languagesFilter.includes(lang)) continue

      // device unknown for snapshot entries; treat as 'unknown' and filter if needed
      if (deviceFilter !== 'all' && deviceFilter !== 'unknown') continue

      const region = regionFromProfile(profile)
      if (regionFilter !== 'all' && region !== regionFilter) continue

      const hour = new Date(profile.user.createdAt)
      addEntry(hour, lang, profile.user.id)
    }

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

    const totalSessions = hourlyData.reduce((s, d) => s + d.sessionCount, 0)
    const totalUsers = new Set(hourlyData.map(d => `${d.language}::${d.timestamp}`)).size // approximate unique points
    const languagesTracked = new Set(hourlyData.map(d => d.language)).size

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
