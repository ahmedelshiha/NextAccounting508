import prisma from '@/lib/prisma'
import { Prisma, $Enums } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bookings - Get bookings (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: Prisma.BookingWhereInput = {}

    // If user is CLIENT, only show their bookings
    if (session?.user?.role === 'CLIENT') {
      where.clientId = session?.user?.id
    }
    // If user is ADMIN or STAFF, they can see all bookings or filter by userId
    else if (userId) {
      where.clientId = userId
    }

    if (status) {
      // Cast incoming status string to BookingStatus enum
      where.status = status as $Enums.BookingStatus
    }

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
            slug: true,
            duration: true,
            price: true
          }
        },
        assignedTeamMember: {
          select: { id: true, name: true, email: true, title: true }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const {
      serviceId,
      scheduledAt,
      notes,
      clientName,
      clientEmail,
      clientPhone,
      assignedTeamMemberId
    } = body

    // Basic validation
    if (!serviceId || !scheduledAt || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: 'Service, scheduled time, client name, and email are required' },
        { status: 400 }
      )
    }

    // Verify service exists and get duration
    const service = await prisma.service.findFirst({
      where: { id: serviceId, active: true }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Check for scheduling conflicts
    const scheduledDate = new Date(scheduledAt)
    const duration = service.duration || 60 // Default 60 minutes
    const endTime = new Date(scheduledDate.getTime() + duration * 60000)

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        scheduledAt: {
          lt: endTime
        },
        AND: {
          scheduledAt: {
            gte: new Date(scheduledDate.getTime() - 60 * 60000) // 1 hour buffer
          }
        },
        status: {
          in: [$Enums.BookingStatus.PENDING, $Enums.BookingStatus.CONFIRMED]
        }
      }
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 400 }
      )
    }

    const isAdminOrStaff = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF'
    const targetClientId = (isAdminOrStaff && body.clientId) ? body.clientId : session?.user?.id

    const booking = await prisma.booking.create({
      data: {
        clientId: targetClientId,
        serviceId,
        scheduledAt: scheduledDate,
        duration,
        notes,
        clientName,
        clientEmail,
        clientPhone,
        status: $Enums.BookingStatus.PENDING,
        assignedTeamMemberId: assignedTeamMemberId || null
      },
      include: {
        service: {
          select: {
            name: true,
            slug: true,
            price: true
          }
        },
        assignedTeamMember: { select: { id: true, name: true, email: true, title: true } }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
