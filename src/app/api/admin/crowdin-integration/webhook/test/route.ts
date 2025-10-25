import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Test webhook delivery
export const POST = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simulate sending a test webhook delivery to Crowdin
    // In a real implementation, this would:
    // 1. Get the configured Crowdin API token
    // 2. Call Crowdin's test webhook endpoint
    // 3. Return the result

    const testPayload = {
      event: 'translation.completed',
      timestamp: new Date().toISOString(),
      data: {
        projectId: 'test-project',
        languageId: 'en',
        translationsCount: 42,
      },
    }

    return Response.json({
      success: true,
      data: {
        testDeliveryId: `test_${Date.now()}`,
        message: 'Test webhook delivery sent successfully',
        payload: testPayload,
        sentAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Failed to test webhook delivery:', error)
    return Response.json(
      { error: error.message || 'Failed to test webhook delivery' },
      { status: 500 }
    )
  }
})
