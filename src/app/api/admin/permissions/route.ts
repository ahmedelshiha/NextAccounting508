import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '@/lib/permissions'

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
