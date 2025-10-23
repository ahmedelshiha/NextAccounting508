import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { frequency } = body

    if (!['none', 'daily', 'weekly'].includes(frequency)) {
      return Response.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    return Response.json({
      success: true,
      data: {
        frequency,
        message: `Audit schedule ${frequency === 'none' ? 'disabled' : `set to ${frequency}`}`,
      },
    })
  } catch (error: any) {
    console.error('Failed to schedule audit:', error)
    return Response.json({ error: error.message || 'Failed to schedule audit' }, { status: 500 })
  }
})
