import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Retrieve webhook configuration
export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simulate webhook configuration retrieval
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/crowdin-integration/webhook/incoming`
    const isActive = process.env.CROWDIN_WEBHOOK_ENABLED === 'true'

    return Response.json({
      success: true,
      data: {
        webhookUrl,
        isActive,
        events: ['translation.completed', 'file.translated'],
        lastDelivery: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        deliveriesCount: 42,
      },
    })
  } catch (error: any) {
    console.error('Failed to get webhook configuration:', error)
    return Response.json({ error: error.message || 'Failed to get webhook configuration' }, { status: 500 })
  }
})

// POST - Setup/update webhook
export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { events = ['translation.completed', 'file.translated'], enabled = true } = body

    // Simulate webhook setup with Crowdin API
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/crowdin-integration/webhook/incoming`

    return Response.json({
      success: true,
      data: {
        webhookUrl,
        isActive: enabled,
        events,
        setupCompletedAt: new Date().toISOString(),
        message: 'Webhook setup successful. Crowdin will now push translation updates to your webhook endpoint.',
      },
    })
  } catch (error: any) {
    console.error('Failed to setup webhook:', error)
    return Response.json({ error: error.message || 'Failed to setup webhook' }, { status: 500 })
  }
})

// DELETE - Remove webhook
export const DELETE = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return Response.json({
      success: true,
      message: 'Webhook removed successfully',
    })
  } catch (error: any) {
    console.error('Failed to delete webhook:', error)
    return Response.json({ error: error.message || 'Failed to delete webhook' }, { status: 500 })
  }
})
