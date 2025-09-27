import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

/**
 * Convert a service request to a booking
 * This creates a proper booking record and links it to the original service request
 * POST /api/admin/service-requests/[id]/convert-to-booking
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions - user must be able to manage service requests
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to convert service requests' },
        { status: 403 }
      )
    }

    // Get the service request with all related data
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
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
            duration: true,
            price: true,
            category: true
          }
        },
        assignedTeamMember: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      )
    }

    // Check if service request is in a convertible status
    const convertibleStatuses = ['APPROVED', 'ASSIGNED', 'IN_PROGRESS']
    if (!convertibleStatuses.includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: `Service request must be in APPROVED, ASSIGNED, or IN_PROGRESS status to convert to booking. Current status: ${serviceRequest.status}` },
        { status: 400 }
      )
    }

    // Check if already converted to booking
    if (serviceRequest.isBooking) {
      return NextResponse.json(
        { error: 'Service request is already marked as a booking' },
        { status: 400 }
      )
    }

    // Parse request body for optional booking details
    const body = await request.json().catch(() => ({}))
    const {
      scheduledAt,
      duration,
      notes,
      location = 'OFFICE',
      priority = serviceRequest.priority
    } = body

    // Use provided scheduling or default to 24 hours from now
    const defaultScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    const bookingScheduledAt = scheduledAt ? new Date(scheduledAt) : defaultScheduledAt

    // Use service duration or default to 60 minutes
    const bookingDuration = duration || serviceRequest.service?.duration || 60

    // Create the booking record
    const booking = await prisma.booking.create({
      data: {
        clientId: serviceRequest.clientId,
        serviceId: serviceRequest.serviceId,
        status: 'PENDING', // New bookings start as pending
        scheduledAt: bookingScheduledAt,
        duration: bookingDuration,
        notes: notes || serviceRequest.description || null,
        clientName: serviceRequest.clientName || serviceRequest.client?.name || 'Unknown Client',
        clientEmail: serviceRequest.clientEmail || serviceRequest.client?.email || '',
        clientPhone: serviceRequest.clientPhone || null,
        adminNotes: `Converted from Service Request #${serviceRequest.id.slice(-8).toUpperCase()}`,
        confirmed: false,
        reminderSent: false,
        assignedTeamMemberId: serviceRequest.assignedTeamMemberId,
        // Link back to the originating service request
        serviceRequestId: serviceRequest.id
      },
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
            category: true
          }
        },
        assignedTeamMember: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Update the service request to mark it as converted
    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED', // Mark as completed since it's now a booking
        isBooking: true, // Mark as booking type
        scheduledAt: bookingScheduledAt,
        duration: bookingDuration,
        completedAt: new Date()
      }
    })

    // Add a comment to the service request tracking the conversion
    try {
      await prisma.serviceRequestComment.create({
        data: {
          serviceRequestId: id,
          authorId: session.user.id,
          content: `Service request converted to booking #${booking.id.slice(-8).toUpperCase()}. Scheduled for ${bookingScheduledAt.toLocaleDateString()} at ${bookingScheduledAt.toLocaleTimeString()}.`
        }
      })
    } catch (commentError) {
      // Non-critical error - log but don't fail the conversion
      console.warn('Failed to add conversion comment:', commentError)
    }

    // Auto-create tasks for the new booking if the service request had specific requirements
    if (serviceRequest.requirements && typeof serviceRequest.requirements === 'object') {
      try {
        // Note: Task creation disabled since Task model doesn't have bookingId field
        // TODO: Add bookingId field to Task model or create relationship table
        console.log('Task creation skipped - no bookingId field in Task model')
      } catch (taskError) {
        // Non-critical error - log but don't fail the conversion
        console.warn('Failed to create automatic tasks:', taskError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Service request successfully converted to booking',
      bookingId: booking.id,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt.toISOString(),
        duration: booking.duration,
        status: booking.status,
        clientName: booking.clientName,
        serviceName: booking.service?.name,
        assignedTo: booking.assignedTeamMember?.name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error converting service request to booking:', error)
    return NextResponse.json(
      { error: 'Internal server error during conversion' },
      { status: 500 }
    )
  }
}