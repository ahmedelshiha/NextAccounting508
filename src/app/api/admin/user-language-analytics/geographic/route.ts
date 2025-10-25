import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface RegionalBreakdown {
  region: string
  country?: string
  timezone?: string
  languages: Array<{
    code: string
    users: number
    percentage: number
  }>
  totalUsers: number
}

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simulate geographic breakdown data
    const data: RegionalBreakdown[] = [
      {
        region: 'Middle East & North Africa',
        timezone: 'Africa/Cairo',
        languages: [
          { code: 'ar', users: 1850, percentage: 92.5 },
          { code: 'en', users: 150, percentage: 7.5 },
        ],
        totalUsers: 2000,
      },
      {
        region: 'South Asia',
        timezone: 'Asia/Kolkata',
        languages: [
          { code: 'hi', users: 750, percentage: 75.0 },
          { code: 'en', users: 250, percentage: 25.0 },
        ],
        totalUsers: 1000,
      },
      {
        region: 'North America',
        timezone: 'America/New_York',
        languages: [
          { code: 'en', users: 1200, percentage: 95.2 },
          { code: 'ar', users: 40, percentage: 3.2 },
          { code: 'hi', users: 20, percentage: 1.6 },
        ],
        totalUsers: 1260,
      },
      {
        region: 'Europe',
        timezone: 'Europe/London',
        languages: [
          { code: 'en', users: 800, percentage: 94.1 },
          { code: 'ar', users: 30, percentage: 3.5 },
          { code: 'hi', users: 20, percentage: 2.4 },
        ],
        totalUsers: 850,
      },
      {
        region: 'Southeast Asia',
        timezone: 'Asia/Bangkok',
        languages: [
          { code: 'en', users: 400, percentage: 80.0 },
          { code: 'hi', users: 80, percentage: 16.0 },
          { code: 'ar', users: 20, percentage: 4.0 },
        ],
        totalUsers: 500,
      },
    ]

    const summary = {
      totalRegions: data.length,
      totalUsersTracked: data.reduce((sum, r) => sum + r.totalUsers, 0),
      languagesAcrossRegions: 3,
      mostDiverseRegion: data.reduce((prev, current) =>
        current.languages.length > prev.languages.length ? current : prev
      ),
    }

    return Response.json({
      success: true,
      data: {
        regions: data,
        summary,
      },
    })
  } catch (error: any) {
    console.error('Failed to get geographic analytics:', error)
    return Response.json({ error: error.message || 'Failed to get geographic analytics' }, { status: 500 })
  }
})
