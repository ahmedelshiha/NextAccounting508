import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId
    const userId = ctx.userId
    
    // Apply rate limiting
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`portal-bookings:${ip}`, 100, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For portal users, only show their own bookings
    const bookings = await prisma.booking.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        clientId: userId  // Using clientId instead of userId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true
          }
        }
      }
    })

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      serviceId: booking.serviceId,
      serviceName: booking.service?.name || 'Unknown Service',
      serviceDescription: booking.service?.description || '',
      price: booking.service?.price || 0,
      duration: booking.service?.duration || booking.duration || 0,
      scheduledAt: booking.scheduledAt,  // Using scheduledAt instead of date/time
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (err) {
    console.error('GET /api/portal/bookings error', err)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId
    const userId = ctx.userId
    
    // Apply rate limiting
    const ip = getClientIp(req as unknown as Request)
    const rl = await applyRateLimit(`portal-bookings-create:${ip}`, 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { 
      serviceId, 
      scheduledAt,  // Using scheduledAt instead of date/time
      notes = '',
      clientName,
      clientEmail,
      clientPhone
    } = body || {}
    
    if (!serviceId || !scheduledAt) {
      return NextResponse.json({ 
        error: 'Missing required fields: serviceId and scheduledAt are required' 
      }, { status: 400 })
    }

    // Check if service exists
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        ...(tenantId ? { tenantId } : {})
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Get user's name and email for booking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        clientId: userId,  // Using clientId instead of userId
        scheduledAt: new Date(scheduledAt),  // Convert to Date
        duration: service.duration || 60,  // Use service duration or default to 60
        notes,
        clientName: clientName || user?.name || 'Unknown',
        clientEmail: clientEmail || user?.email || '',
        clientPhone: clientPhone || '',
        status: 'PENDING',
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true
          }
        }
      }
    })
    
    const formattedBooking = {
      id: booking.id,
      serviceId: booking.serviceId,
      serviceName: booking.service?.name || 'Unknown Service',
      serviceDescription: booking.service?.description || '',
      price: booking.service?.price || 0,
      duration: booking.service?.duration || booking.duration || 0,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }

    return NextResponse.json({ booking: formattedBooking }, { status: 201 })
  } catch (err) {
    console.error('POST /api/portal/bookings error', err)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
})
