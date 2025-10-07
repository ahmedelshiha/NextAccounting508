import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '@/lib/permissions'
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

  const allPermissions = Object.values(PERMISSIONS)
  const roles = Object.keys(ROLE_PERMISSIONS)

  return NextResponse.json({
    success: true,
    data: {
      permissions: allPermissions,
      roles,
      rolePermissions: ROLE_PERMISSIONS,
    },
  })
})
