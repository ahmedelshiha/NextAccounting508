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

    const tenantId = ctx.tenantId as string
    const integration = await prisma.crowdinIntegration.findUnique({ where: { tenantId } })

    if (!integration) {
      return Response.json({
        success: true,
        data: {
          lastSyncAt: null,
          lastSyncStatus: null,
          testConnectionOk: false,
        },
      })
    }

    return Response.json({
      success: true,
      data: {
        lastSyncAt: integration.lastSyncAt,
        lastSyncStatus: integration.lastSyncStatus,
        testConnectionOk: integration.testConnectionOk,
      },
    })
  } catch (error: any) {
    console.error('Failed to get Crowdin status:', error)
    return Response.json({ error: error.message || 'Failed to get Crowdin status' }, { status: 500 })
  }
})
