import { NextResponse } from 'next/server'
import { ROLE_PERMISSIONS, PERMISSIONS, hasPermission } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { NextRequest } from 'next/server'
import { verifySuperAdminStepUp, stepUpChallenge } from '@/lib/security/step-up'

export const GET = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (ctx.isSuperAdmin) {
    const ok = await verifySuperAdminStepUp(req, String(ctx.userId || ''))
    if (!ok) return stepUpChallenge()
  }

  return NextResponse.json({
    success: true,
    data: {
      roles: Object.keys(ROLE_PERMISSIONS),
      rolePermissions: ROLE_PERMISSIONS,
    },
  })
})
