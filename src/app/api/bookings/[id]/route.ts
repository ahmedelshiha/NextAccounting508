import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { BookingStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/bookings/[id] - Get booking by ID
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { bookings: true } }
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            duration: true,
            price: true,
            description: true
          }
        },
        assignedTeamMember: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Ensure client object present for legacy/mocked DB responses
    if (!(booking as any).client && (booking as any).clientId) {
      ;(booking as any).client = { id: (booking as any).clientId, name: '', email: '' }
    }

    // Check permissions - clients can only see their own bookings
    if (session?.user?.role === 'CLIENT' && booking.clientId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    try { console.debug && console.debug('PUT session', session) } catch {}

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, scheduledAt, notes, adminNotes, confirmed, assignedTeamMemberId, serviceRequestId } = body

    // Get existing booking to check permissions
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = existingBooking.clientId === session?.user?.id
    const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(session?.user?.role ?? '')

    if (!isOwner && !isAdminOrStaff) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Prepare update data based on user role
    const updateData: Partial<import('@prisma/client').Prisma.BookingUpdateInput> = {}

    // Debug: log body and existing booking for test troubleshooting
    try { console.debug && console.debug('PUT booking body', { body, existingBooking: existingBooking }) } catch {}

    if (isAdminOrStaff) {
      // Admin/Staff can update everything
      if (status) updateData.status = status as BookingStatus
      if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt)
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes
      if (confirmed !== undefined) updateData.confirmed = confirmed
      if (assignedTeamMemberId !== undefined) {
        updateData.assignedTeamMember = assignedTeamMemberId
          ? { connect: { id: String(assignedTeamMemberId) } }
          : { disconnect: true }
      }
      if (serviceRequestId !== undefined) {
        updateData.serviceRequest = serviceRequestId
          ? { connect: { id: String(serviceRequestId) } }
          : { disconnect: true }
      }
      // Allow admin/staff to update client-visible notes if provided
      if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
        updateData.notes = (body as any).notes
      }
    }

    if (isOwner) {
      // Clients can update notes and reschedule (if not confirmed)
      if (Object.prototype.hasOwnProperty.call(body, 'notes')) updateData.notes = (body as any).notes
      if (scheduledAt && !existingBooking.confirmed) {
        updateData.scheduledAt = new Date(scheduledAt)
      }
    }

    try { console.debug && console.debug('Booking updateData', updateData) } catch {}
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { bookings: true } }
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
        assignedTeamMember: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = booking.clientId === session?.user?.id
    const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(session?.user?.role ?? '')

    if (!isOwner && !isAdminOrStaff) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update status to CANCELLED instead of deleting
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ message: 'Booking cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
