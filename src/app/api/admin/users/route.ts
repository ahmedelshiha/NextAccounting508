import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  void request
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || !hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      const fallback = [
        { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', role: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', role: 'STAFF', createdAt: new Date().toISOString() },
        { id: 'demo-client', name: 'John Smith', email: 'john@example.com', role: 'CLIENT', createdAt: new Date().toISOString() },
      ]
      const filtered = q ? fallback.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase())) : fallback
      const total = filtered.length
      const start = (page - 1) * limit
      const items = filtered.slice(start, start + limit)
      return NextResponse.json({ users: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { bookings: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    const mapped = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, totalBookings: u._count.bookings }))
    return NextResponse.json({ users: mapped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
