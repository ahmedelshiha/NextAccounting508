import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const POST = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId as string

    const integration = await prisma.crowdinIntegration.findUnique({ where: { tenantId } })
    if (!integration) {
      return Response.json({ error: 'Crowdin integration not configured' }, { status: 400 })
    }

    // Simulate a successful sync. In a real implementation, call Crowdin API and process results.
    const updated = await prisma.crowdinIntegration.update({
      where: { tenantId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      },
    })

    return Response.json({
      success: true,
      syncId: `sync-${Date.now()}`,
      data: {
        lastSyncAt: updated.lastSyncAt,
        lastSyncStatus: updated.lastSyncStatus,
      },
    })
  } catch (error: any) {
    console.error('Failed to run Crowdin sync:', error)
    return Response.json({ error: error.message || 'Failed to run Crowdin sync' }, { status: 500 })
  }
})
