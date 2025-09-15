import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
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
