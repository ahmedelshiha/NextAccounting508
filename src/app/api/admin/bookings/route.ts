import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { withCache, handleCacheInvalidation } from '@/lib/api-cache'
import { parseListQuery } from '@/schemas/list-query'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

// Type for bookings response
type BookingsResponse = {
  bookings: any[]
  total: number
  page: number
  totalPages: number
}

// Create cached handler for bookings data (tenant-aware)
const getCachedBookings = withCache<BookingsResponse>(
  {
    key: 'admin-bookings',
    ttl: 120,
    staleWhileRevalidate: 240,
    tenantAware: true,
  },
  async (request: NextRequest): Promise<BookingsResponse> => {
    const ctx = requireTenantContext()
    const { searchParams } = new URL(request.url)
    const common = parseListQuery(searchParams, {
      allowedSortBy: ['scheduledAt', 'createdAt', 'status'],
      defaultSortBy: 'scheduledAt',
      maxLimit: 100,
    })
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.BookingWhereInput = {}

    // Tenant scoping using Booking.tenantId
    const safeTenantScope = ctx.tenantId && ctx.tenantId !== 'undefined'
    if (safeTenantScope) {
      (where as any).tenantId = String(ctx.tenantId)
    }

    if (status && status !== 'all') {
      where.status = status as any
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { service: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (startDate || endDate) {
      where.scheduledAt = {}
      if (startDate) where.scheduledAt.gte = new Date(startDate)
      if (endDate) where.scheduledAt.lte = new Date(endDate)
    }

    const take = common.limit
    const skip = common.skip
    const sortBy = common.sortBy
    const sortOrder: 'asc' | 'desc' = common.sortOrder

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { bookings: true } },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            duration: true,
          },
        },
        assignedTeamMember: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      take,
      skip,
    })

    const total = await prisma.booking.count({ where })

    const takeVal = take ?? total
    const skipVal = skip ?? 0
    const page = takeVal > 0 ? Math.floor(skipVal / takeVal) + 1 : 1
    const totalPages = takeVal > 0 ? Math.max(1, Math.ceil(total / takeVal)) : 1

    return { bookings, total, page, totalPages }
  }
)

// GET /api/admin/bookings - Get all bookings for admin
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.role || !hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return getCachedBookings(request)
  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
})

// POST /api/admin/bookings - Create booking as admin
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.role || !hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, serviceId, scheduledAt, duration, notes, clientName, clientEmail, clientPhone } = body

    if (!serviceId || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'Service, scheduled time, and duration are required' },
        { status: 400 }
      )
    }

    const bookingData: Partial<Prisma.BookingUncheckedCreateInput> = {
      serviceId,
      scheduledAt: new Date(scheduledAt),
      duration,
      notes,
      status: 'CONFIRMED',
    }

    if (clientId) {
      const client = await prisma.user.findFirst({
        where: {
          id: clientId,
          ...(ctx.tenantId && ctx.tenantId !== 'undefined' ? { tenantId: String(ctx.tenantId) } : {}),
        },
      })
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      bookingData.clientId = clientId
      bookingData.clientName = client.name ?? ''
      bookingData.clientEmail = client.email
    } else {
      if (!clientName || !clientEmail) {
        return NextResponse.json(
          { error: 'Client name and email are required' },
          { status: 400 }
        )
      }

      // Legacy path: allow guest booking without user linkage
      bookingData.clientName = clientName
      bookingData.clientEmail = clientEmail
      bookingData.clientPhone = clientPhone
      // Note: clientId is required in schema; in test environments this is mocked
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        scheduledAt: new Date(scheduledAt),
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(ctx.tenantId && ctx.tenantId !== 'undefined'
          ? { tenantId: String(ctx.tenantId) }
          : {}),
      },
    })

    if (conflictingBooking) {
      return NextResponse.json({ error: 'Time slot is already booked' }, { status: 409 })
    }

    // Prefer nested connect for relations to satisfy typed create inputs. Fall back to unchecked fields when not available.
    const createPayload: any = { ...bookingData }
    if (bookingData.clientId) {
      createPayload.client = { connect: { id: bookingData.clientId } }
      delete createPayload.clientId
    }
    if ((bookingData as any).serviceId) {
      createPayload.service = { connect: { id: (bookingData as any).serviceId } }
      delete createPayload.serviceId
    }
    if (ctx.tenantId) {
      createPayload.tenant = { connect: { id: String(ctx.tenantId) } }
    }

    const booking = await prisma.booking.create({
      data: createPayload,
      include: {
        client: {
          select: { id: true, name: true, email: true, _count: { select: { bookings: true } } },
        },
        service: { select: { id: true, name: true, price: true } },
      },
    })

    await logAudit({ action: 'booking.create', actorId: ctx.userId ?? null, targetId: booking.id, details: { serviceId, scheduledAt } })

    await handleCacheInvalidation('BOOKING_CHANGED', ctx.tenantId ?? undefined)

    return NextResponse.json({ message: 'Booking created successfully', booking }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
})

// PATCH /api/admin/bookings - Bulk update bookings
export const PATCH = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.role || !hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingIds, action, data } = body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json({ error: 'Booking IDs are required' }, { status: 400 })
    }

    let updateData: Prisma.BookingUpdateManyMutationInput = {}

    switch (action) {
      case 'confirm':
        updateData = { status: 'CONFIRMED', confirmed: true }
        break
      case 'cancel':
        updateData = { status: 'CANCELLED' }
        break
      case 'complete':
        updateData = { status: 'COMPLETED' }
        break
      case 'update':
        if (data) updateData = data
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        ...(ctx.tenantId && ctx.tenantId !== 'undefined' ? { tenantId: String(ctx.tenantId) } : {}),
      },
      data: updateData,
    })

    await logAudit({ action: `booking.bulk.${action}`, actorId: ctx.userId ?? null, details: { count: result.count, bookingIds } })

    await handleCacheInvalidation('BOOKING_CHANGED', ctx.tenantId ?? undefined)

    return NextResponse.json({ message: `Successfully updated ${result.count} bookings`, updated: result.count })
  } catch (error) {
    console.error('Error bulk updating bookings:', error)
    return NextResponse.json({ error: 'Failed to update bookings' }, { status: 500 })
  }
})

// DELETE /api/admin/bookings - Bulk delete bookings
export const DELETE = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.role || !hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingIds } = body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json({ error: 'Booking IDs are required' }, { status: 400 })
    }

    const result = await prisma.booking.deleteMany({
      where: {
        id: { in: bookingIds },
        ...(ctx.tenantId && ctx.tenantId !== 'undefined' ? { tenantId: String(ctx.tenantId) } : {}),
      },
    })

    await logAudit({ action: 'booking.bulk.delete', actorId: ctx.userId ?? null, details: { count: result.count, bookingIds } })

    await handleCacheInvalidation('BOOKING_CHANGED', ctx.tenantId ?? undefined)

    return NextResponse.json({ message: `Successfully deleted ${result.count} bookings`, deleted: result.count })
  } catch (error) {
    console.error('Error bulk deleting bookings:', error)
    return NextResponse.json({ error: 'Failed to delete bookings' }, { status: 500 })
  }
})
