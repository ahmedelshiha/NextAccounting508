import { NextResponse } from 'next/server'
import { ROLE_PERMISSIONS, PERMISSIONS, hasPermission } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: {
      roles: Object.keys(ROLE_PERMISSIONS),
      rolePermissions: ROLE_PERMISSIONS,
    },
  })
})
