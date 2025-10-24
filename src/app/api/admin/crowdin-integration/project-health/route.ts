import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Placeholder health data; in production, query Crowdin API for real values
  const health = [
    { language: 'en', completion: 100 },
    { language: 'ar', completion: 89 },
    { language: 'hi', completion: 76 },
  ]

  return Response.json({ success: true, data: health })
})
