import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { parseListQuery } from '@/schemas/list-query'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : undefined
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user?.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const { searchParams } = new URL(request.url)
    const { page, limit, skip, sortBy, sortOrder, q } = parseListQuery(searchParams, {
      allowedSortBy: ['date', 'amountCents', 'createdAt', 'updatedAt', 'status', 'vendor'],
      defaultSortBy: 'date',
      maxLimit: 100,
    })

    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const dateFrom = parseDate(searchParams.get('dateFrom'))
    const dateTo = parseDate(searchParams.get('dateTo'))
    const tenantId = getTenantFromRequest(request as unknown as Request)

    const where: any = { ...tenantFilter(tenantId) }
    if (status && status !== 'all') where.status = status
    if (category && category !== 'all') where.category = category
    if (q) where.vendor = { contains: q, mode: 'insensitive' }
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = dateFrom
      if (dateTo) where.date.lte = dateTo
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { attachment: { select: { id: true, url: true, avStatus: true } }, user: { select: { id: true, name: true, email: true } } },
      orderBy: { [sortBy]: sortOrder } as any,
      skip,
      take: limit,
    })
    const total = await prisma.expense.count({ where })

    return NextResponse.json({ expenses, total, page, limit })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user?.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const body = await request.json().catch(() => null)
    const { vendor, category, status, amountCents, currency, date, attachmentId } = body || {}
    if (!vendor || !date || typeof amountCents !== 'number') {
      return NextResponse.json({ error: 'vendor, date, amountCents are required' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        vendor,
        category: category || 'general',
        status: status || 'PENDING',
        amountCents: Math.max(0, Math.round(amountCents)),
        currency: currency || 'USD',
        date: new Date(date),
        attachmentId: attachmentId || null,
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ message: 'Expense created', expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user?.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const body = await request.json().catch(() => null)
    const { expenseIds } = body || {}
    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json({ error: 'expenseIds array required' }, { status: 400 })
    }

    const result = await prisma.expense.deleteMany({ where: { id: { in: expenseIds } } })
    return NextResponse.json({ message: `Deleted ${result.count} expenses`, deleted: result.count })
  } catch (error) {
    console.error('Error deleting expenses:', error)
    return NextResponse.json({ error: 'Failed to delete expenses' }, { status: 500 })
  }
}
