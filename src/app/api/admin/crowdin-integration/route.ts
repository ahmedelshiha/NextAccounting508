import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId as string

    const integration = await prisma.crowdinIntegration.findUnique({
      where: { tenantId },
    })

    if (!integration) {
      return Response.json({
        success: true,
        data: {
          projectId: '',
          apiTokenMasked: '',
          autoSyncDaily: true,
          syncOnDeploy: false,
          createPrs: true,
          lastSyncAt: null,
          lastSyncStatus: null,
          testConnectionOk: false,
        },
      })
    }

    return Response.json({
      success: true,
      data: {
        projectId: integration.projectId,
        apiTokenMasked: integration.apiTokenMasked,
        autoSyncDaily: integration.autoSyncDaily,
        syncOnDeploy: integration.syncOnDeploy,
        createPrs: integration.createPrs,
        lastSyncAt: integration.lastSyncAt,
        lastSyncStatus: integration.lastSyncStatus,
        testConnectionOk: integration.testConnectionOk,
      },
    })
  } catch (error: any) {
    console.error('Failed to get Crowdin integration:', error)
    return Response.json({ error: error.message || 'Failed to get Crowdin integration' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId as string
    const body = await req.json()
    const { projectId, apiToken, autoSyncDaily, syncOnDeploy, createPrs } = body

    if (!projectId || !apiToken) {
      return Response.json({ error: 'Project ID and API token are required' }, { status: 400 })
    }

    const integration = await prisma.crowdinIntegration.upsert({
      where: { tenantId },
      create: {
        tenantId,
        projectId,
        apiTokenMasked: apiToken.slice(-20),
        apiTokenEncrypted: apiToken,
        autoSyncDaily: autoSyncDaily ?? true,
        syncOnDeploy: syncOnDeploy ?? false,
        createPrs: createPrs ?? true,
        testConnectionOk: false,
      },
      update: {
        projectId: projectId || undefined,
        apiTokenMasked: apiToken ? apiToken.slice(-20) : undefined,
        apiTokenEncrypted: apiToken || undefined,
        autoSyncDaily: autoSyncDaily !== undefined ? autoSyncDaily : undefined,
        syncOnDeploy: syncOnDeploy !== undefined ? syncOnDeploy : undefined,
        createPrs: createPrs !== undefined ? createPrs : undefined,
      },
    })

    return Response.json({
      success: true,
      data: {
        projectId: integration.projectId,
        apiTokenMasked: integration.apiTokenMasked,
        autoSyncDaily: integration.autoSyncDaily,
        syncOnDeploy: integration.syncOnDeploy,
        createPrs: integration.createPrs,
      },
    })
  } catch (error: any) {
    console.error('Failed to save Crowdin integration:', error)
    return Response.json({ error: error.message || 'Failed to save Crowdin integration' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, apiToken } = body

    if (!projectId || !apiToken) {
      return Response.json({ error: 'Project ID and API token are required' }, { status: 400 })
    }

    try {
      const response = await fetch('https://api.crowdin.com/api/v2/projects', {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      })

      const success = response.ok

      return Response.json({
        success: true,
        data: {
          success,
          message: success ? 'Connection successful' : 'Connection failed',
        },
      })
    } catch (err: any) {
      return Response.json({
        success: true,
        data: {
          success: false,
          message: err.message,
        },
      })
    }
  } catch (error: any) {
    console.error('Failed to test Crowdin connection:', error)
    return Response.json({ error: error.message || 'Failed to test connection' }, { status: 500 })
  }
})
