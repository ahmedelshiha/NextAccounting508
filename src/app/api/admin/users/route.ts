import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/users - List users with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = parseInt(searchParams.get('skip') || '0', 10)

    const where: import('@prisma/client').Prisma.UserWhereInput = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    }
    if (role && ['ADMIN', 'STAFF', 'CLIENT'].includes(role)) {
      where.role = role as any
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: { id: true, name: true, email: true, role: true, defaultCurrency: true, createdAt: true }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({ users, total, page: Math.floor(skip / limit) + 1, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// PATCH /api/admin/users - Bulk update roles or default currency
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user?.role ?? '') !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userIds, role, defaultCurrency } = body || {}
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds is required' }, { status: 400 })
    }

    const data: any = {}
    if (role) {
      if (!['ADMIN', 'STAFF', 'CLIENT'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      data.role = role
    }
    if (defaultCurrency) {
      if (!['USD', 'SAR', 'AED', 'EGP'].includes(defaultCurrency)) {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
      }
      data.defaultCurrency = defaultCurrency
    }
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const result = await prisma.user.updateMany({ where: { id: { in: userIds } }, data })
    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Error updating users:', error)
    return NextResponse.json({ error: 'Failed to update users' }, { status: 500 })
  }
}
