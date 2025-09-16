import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '@/lib/permissions'

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
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
}
