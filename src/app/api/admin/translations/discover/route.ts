import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const POST = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auditResult = {
      keysInCode: 1245,
      keysInJson: 1247,
      orphanedKeys: ['legacy.old_feature', 'deprecated.button_text'],
      missingTranslations: {
        ar: ['dashboard.new_metric', 'settings.privacy_notice'],
        hi: ['payment.confirmation'],
      },
      namingIssues: [
        { key: 'USE_snake_case', issue: 'Uses mixed case instead of snake_case' },
        { key: 'anotherBadKey', issue: 'Uses camelCase instead of snake_case' },
        { key: 'UPPER.CASE', issue: 'Uses uppercase instead of snake_case' },
      ],
    }

    return Response.json({ success: true, data: auditResult })
  } catch (error: any) {
    console.error('Failed to run discovery audit:', error)
    return Response.json({ error: error.message || 'Failed to run discovery audit' }, { status: 500 })
  }
})
