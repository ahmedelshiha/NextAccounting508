import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Placeholder sample data until product events are available
    const sample = [
      { feature: 'booking', usage: 1245, pct: '45.2' },
      { feature: 'invoices', usage: 765, pct: '27.8' },
      { feature: 'reports', usage: 432, pct: '15.7' },
      { feature: 'chat', usage: 256, pct: '9.3' },
    ]

    return Response.json({ success: true, data: sample })
  } catch (error: any) {
    console.error('Failed to get feature usage:', error)
    return Response.json({ error: error.message || 'Failed to get feature usage' }, { status: 500 })
  }
})
