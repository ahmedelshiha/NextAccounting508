import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const tenantId = getTenantFromRequest(request as unknown as Request)
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || !hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let useFallback = false
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (e: any) {
      const code = String(e?.code || '')
      if (code.startsWith('P10')) useFallback = true
    }
    if (useFallback) {
      const fallback = [
        { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', role: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', role: 'STAFF', createdAt: new Date().toISOString() },
        { id: 'demo-client', name: 'John Smith', email: 'john@example.com', role: 'CLIENT', createdAt: new Date().toISOString() },
      ]
      return NextResponse.json({ users: fallback })
    }

    const users = await prisma.user.findMany({
      where: tenantFilter(tenantId),
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { bookings: true } } }
    })
    const mapped = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, totalBookings: u._count.bookings }))
    return NextResponse.json({ users: mapped })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
