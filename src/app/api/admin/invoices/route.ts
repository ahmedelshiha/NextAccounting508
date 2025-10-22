import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'
import { parseListQuery } from '@/schemas/list-query'
import { tenantFilter } from '@/lib/tenant'

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : undefined
}

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_VIEW)) return respond.forbidden('Forbidden')

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const { searchParams } = new URL(request.url)
    const { page, limit, skip, sortBy, sortOrder, q } = parseListQuery(searchParams, {
      allowedSortBy: ['createdAt', 'updatedAt', 'paidAt', 'totalCents', 'status'],
      defaultSortBy: 'createdAt',
      maxLimit: 100,
    })

    const statusParam = searchParams.get('status')
    const createdFrom = parseDate(searchParams.get('createdFrom'))
    const createdTo = parseDate(searchParams.get('createdTo'))

    const where: any = { ...tenantFilter(ctx.tenantId) }
    if (statusParam && statusParam !== 'all') where.status = statusParam
    if (q) {
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
        { client: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }
    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = createdFrom
      if (createdTo) where.createdAt.lte = createdTo
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, scheduledAt: true } },
        items: true,
      },
      orderBy: { [sortBy]: sortOrder } as any,
      skip,
      take: limit,
    })
    const total = await prisma.invoice.count({ where })

    return NextResponse.json({ invoices, total, page, limit })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const body = await request.json().catch(() => null)
    const { bookingId, items, currency } = body || {}
    if (!bookingId && !Array.isArray(items)) {
      return NextResponse.json({ error: 'bookingId or items are required' }, { status: 400 })
    }

    let clientId: string | undefined
    let totalCents = 0
    const resolvedCurrency: string = currency || 'USD'

    if (bookingId) {
      const booking = await prisma.booking.findFirst({ where: { id: bookingId, ...tenantFilter(ctx.tenantId) }, include: { service: { select: { price: true } }, client: { select: { id: true } } } })
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      clientId = booking.client?.id
      const svcPrice = booking.service?.price ? Number(booking.service.price) : 0
      if (svcPrice > 0) totalCents = Math.round(svcPrice * 100)
    }

    const itemRows: { description: string; quantity: number; unitPriceCents: number; totalCents: number }[] = []
    if (Array.isArray(items)) {
      for (const it of items) {
        const qty = Math.max(1, Number(it.quantity || 1))
        const unit = Math.max(0, Math.round(Number(it.unitPriceCents || 0)))
        const rowTotal = qty * unit
        itemRows.push({ description: String(it.description || 'Item'), quantity: qty, unitPriceCents: unit, totalCents: rowTotal })
        totalCents += rowTotal
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        bookingId: bookingId || null,
        clientId: clientId || null,
        currency: resolvedCurrency,
        totalCents,
        status: 'UNPAID' as any,
        items: itemRows.length ? { create: itemRows } : undefined,
        tenantId: (ctx as any).tenantId,
      },
      include: { items: true },
    })

    await logAudit({ action: 'invoice.create', actorId: ctx.userId ?? null, targetId: invoice.id, details: { bookingId, totalCents } })

    return NextResponse.json({ message: 'Invoice created', invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const body = await request.json().catch(() => null)
    const { invoiceIds } = body || {}
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'invoiceIds array required' }, { status: 400 })
    }

    const result = await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds }, ...tenantFilter(ctx.tenantId) } })
    await logAudit({ action: 'invoice.bulk.delete', actorId: ctx.userId ?? null, details: { count: result.count } })
    return NextResponse.json({ message: `Deleted ${result.count} invoices`, deleted: result.count })
  } catch (error) {
    console.error('Error deleting invoices:', error)
    return NextResponse.json({ error: 'Failed to delete invoices' }, { status: 500 })
  }
})
