import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ROLE_PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: {
      roles: Object.keys(ROLE_PERMISSIONS),
      rolePermissions: ROLE_PERMISSIONS,
    },
  })
}
