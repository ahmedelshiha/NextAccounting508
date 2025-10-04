import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { parseListQuery } from '@/schemas/list-query'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'

const EXPENSE_STATUSES = ['PENDING', 'APPROVED', 'REIMBURSED', 'REJECTED'] as const

const expenseCreateSchema = z.object({
  vendor: z.string().trim().min(1, 'vendor is required'),
  category: z.string().trim().min(1).max(120).optional(),
  status: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => EXPENSE_STATUSES.includes(value as typeof EXPENSE_STATUSES[number]), 'invalid status')
    .optional(),
  amountCents: z.number().finite().nonnegative(),
  currency: z
    .string()
    .trim()
    .min(3)
    .max(10)
    .transform((value) => value.toUpperCase())
    .optional(),
  date: z.union([z.string(), z.date()]),
  attachmentId: z.string().trim().min(1).optional().nullable(),
})

const expenseDeleteSchema = z.object({
  expenseIds: z.array(z.string().trim().min(1)).min(1)
})

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
    const tenantId = getTenantFromRequest(request)

    const where: Prisma.ExpenseWhereInput = {
      ...(tenantFilter(tenantId) as Prisma.ExpenseWhereInput),
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      }
    }

    const query = (q || '').trim()
    if (query) {
      const existingAnd: Prisma.ExpenseWhereInput[] = Array.isArray((where as any).AND)
        ? ((where as any).AND as Prisma.ExpenseWhereInput[])
        : (where as any).AND
        ? [((where as any).AND as Prisma.ExpenseWhereInput)]
        : []
      where.AND = [
        ...existingAnd,
        {
          OR: [
            { vendor: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = { [sortBy]: sortOrder } as Prisma.ExpenseOrderByWithRelationInput

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        attachment: { select: { id: true, url: true, avStatus: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy,
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

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const body = await request.json().catch(() => null)
    const parsed = expenseCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = getTenantFromRequest(request)
    const { vendor, category, status, amountCents, currency, date, attachmentId } = parsed.data

    const expenseDate = date instanceof Date ? date : new Date(date)
    if (!Number.isFinite(expenseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        vendor,
        category: category || 'general',
        status: (status as typeof EXPENSE_STATUSES[number]) || 'PENDING',
        amountCents: Math.max(0, Math.round(amountCents)),
        currency: (currency || 'USD').toUpperCase(),
        date: expenseDate,
        attachmentId: attachmentId ?? null,
        userId: (session.user as any).id,
        ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {}),
      },
      include: {
        attachment: { select: { id: true, url: true, avStatus: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ message: 'Expense created', expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
})

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user?.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const body = await request.json().catch(() => null)
    const parsed = expenseDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = getTenantFromRequest(request)
    const where: Prisma.ExpenseWhereInput = {
      id: { in: parsed.data.expenseIds },
    }

    if (isMultiTenancyEnabled() && tenantId) {
      Object.assign(where, tenantFilter(tenantId) as Prisma.ExpenseWhereInput)
    }

    const result = await prisma.expense.deleteMany({ where })
    return NextResponse.json({ message: `Deleted ${result.count} expenses`, deleted: result.count })
  } catch (error) {
    console.error('Error deleting expenses:', error)
    return NextResponse.json({ error: 'Failed to delete expenses' }, { status: 500 })
  }
}
