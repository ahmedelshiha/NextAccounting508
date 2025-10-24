import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = {
      summary: {
        totalKeys: 1247,
        enCoveragePct: '100%',
        arCoveragePct: '94%',
        hiCoveragePct: '87%',
      },
    }

    return Response.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to get translation status:', error)
    return Response.json({ error: error.message || 'Failed to get translation status' }, { status: 500 })
  }
})
