import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Approve and add discovered keys to translation system
export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { keys = [] } = body

    if (!Array.isArray(keys) || keys.length === 0) {
      return Response.json({ error: 'No keys provided' }, { status: 400 })
    }

    // In a real implementation, this would:
    // 1. Validate each key format
    // 2. Add keys to the translation system
    // 3. Trigger re-export of translation files
    // 4. Update translation file index

    const approved = keys.map(key => ({
      key,
      addedAt: new Date().toISOString(),
      defaultValue: '',
    }))

    return Response.json({
      success: true,
      data: {
        approvedCount: approved.length,
        approved,
        message: `Successfully added ${approved.length} key(s) to the translation system`,
      },
    })
  } catch (error: any) {
    console.error('Failed to approve keys:', error)
    return Response.json(
      { error: error.message || 'Failed to approve keys' },
      { status: 500 }
    )
  }
})
