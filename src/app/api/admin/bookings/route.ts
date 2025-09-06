import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'

// GET /api/admin/bookings - Get all bookings for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const skip = searchParams.get('skip')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: Prisma.BookingWhereInput = {}

    if (status && status !== 'all') {
      // Cast incoming status string to BookingStatus enum
      where.status = status as BookingStatus
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { service: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (startDate || endDate) {
      where.scheduledAt = {}
      if (startDate) {
        where.scheduledAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.scheduledAt.lte = new Date(endDate)
      }
    }

    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined
    })

    // Get total count for pagination
    const total = await prisma.booking.count({ where })

    return NextResponse.json({
      bookings,
      total,
      page: skip ? Math.floor(parseInt(skip) / (parseInt(limit || '10'))) + 1 : 1,
      totalPages: limit ? Math.ceil(total / parseInt(limit)) : 1
    })
  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/bookings - Create booking as admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      clientId,
      serviceId,
      scheduledAt,
      duration,
      notes,
      clientName,
      clientEmail,
      clientPhone
    } = body

    // Validate required fields
    if (!serviceId || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'Service, scheduled time, and duration are required' },
        { status: 400 }
      )
    }

    // If clientId is provided, use existing client
    const bookingData: Prisma.BookingUncheckedCreateInput = {
      serviceId,
      scheduledAt: new Date(scheduledAt),
      duration,
      notes,
      status: BookingStatus.CONFIRMED // Admin bookings are automatically confirmed
    }

    if (clientId) {
      // Verify client exists
      const client = await prisma.user.findUnique({
        where: { id: clientId }
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }

      bookingData.clientId = clientId
      bookingData.clientName = client.name ?? ''
      bookingData.clientEmail = client.email
    } else {
      // Create booking without registered client
      if (!clientName || !clientEmail) {
        return NextResponse.json(
          { error: 'Client name and email are required' },
          { status: 400 }
        )
      }

      bookingData.clientName = clientName
      bookingData.clientEmail = clientEmail
      bookingData.clientPhone = clientPhone
    }

    // Check for scheduling conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        scheduledAt: new Date(scheduledAt),
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        }
      }
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 409 }
      )
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Booking created successfully',
      booking
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/bookings - Bulk update bookings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingIds, action, data } = body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Booking IDs are required' },
        { status: 400 }
      )
    }

    let updateData: Prisma.BookingUpdateManyMutationInput = {}

    switch (action) {
      case 'confirm':
        updateData = {
          status: BookingStatus.CONFIRMED,
          confirmed: true
        }
        break
      
      case 'cancel':
        updateData = {
          status: BookingStatus.CANCELLED
        }
        break
      
      case 'complete':
        updateData = {
          status: BookingStatus.COMPLETED
        }
        break
      
      case 'update':
        if (data) {
          updateData = data
        }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update bookings
    const result = await prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds
        }
      },
      data: updateData
    })

    return NextResponse.json({
      message: `Successfully updated ${result.count} bookings`,
      updated: result.count
    })
  } catch (error) {
    console.error('Error bulk updating bookings:', error)
    return NextResponse.json(
      { error: 'Failed to update bookings' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/bookings - Bulk delete bookings
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user?.role ?? '') !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingIds } = body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Booking IDs are required' },
        { status: 400 }
      )
    }

    // Delete bookings
    const result = await prisma.booking.deleteMany({
      where: {
        id: {
          in: bookingIds
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} bookings`,
      deleted: result.count
    })
  } catch (error) {
    console.error('Error bulk deleting bookings:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookings' },
      { status: 500 }
    )
  }
}
