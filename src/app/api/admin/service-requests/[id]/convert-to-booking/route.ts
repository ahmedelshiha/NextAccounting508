import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import servicesSettingsService, { DEFAULT_SERVICES_SETTINGS } from '@/services/services-settings.service'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

/**
 * Convert a service request to a booking
 * This creates a proper booking record and links it to the original service request
 * POST /api/admin/service-requests/[id]/convert-to-booking
 */
export const POST = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined

    if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the service request with all related data, tenant-scoped
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { id, ...getTenantFilter() },
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, duration: true, price: true, category: true } },
        assignedTeamMember: { select: { id: true, name: true, email: true } },
      },
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    let allowConvertToBooking = true
    try {
      const tenantScopedSettings = await servicesSettingsService.get((serviceRequest as any)?.tenantId ?? null)
      allowConvertToBooking = tenantScopedSettings.serviceRequests.allowConvertToBooking
    } catch {
      allowConvertToBooking = DEFAULT_SERVICES_SETTINGS.serviceRequests.allowConvertToBooking
    }

    if (!allowConvertToBooking) {
      return NextResponse.json(
        { error: 'Converting service requests to bookings is disabled by settings' },
        { status: 403 }
      )
    }

    const convertibleStatuses = ['APPROVED', 'ASSIGNED', 'IN_PROGRESS']
    if (!convertibleStatuses.includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: `Service request must be in APPROVED, ASSIGNED, or IN_PROGRESS status to convert to booking. Current status: ${serviceRequest.status}` },
        { status: 400 }
      )
    }

    if (serviceRequest.isBooking) {
      return NextResponse.json(
        { error: 'Service request is already marked as a booking' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { scheduledAt, duration, notes, location = 'OFFICE', priority = serviceRequest.priority } = body as any

    const defaultScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const bookingScheduledAt = scheduledAt ? new Date(scheduledAt) : defaultScheduledAt
    const bookingDuration = duration || serviceRequest.service?.duration || 60

    const booking = await prisma.booking.create({
      data: {
        client: { connect: { id: serviceRequest.clientId } },
        service: { connect: { id: serviceRequest.serviceId } },
        status: 'PENDING' as any,
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
        serviceRequestId: serviceRequest.id,
        ...(getTenantFilter()),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, category: true } },
        assignedTeamMember: { select: { id: true, name: true, email: true } },
      },
    })

    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED' as any,
        isBooking: true,
        scheduledAt: bookingScheduledAt,
        duration: bookingDuration,
        completedAt: new Date(),
      },
    })

    try {
      await prisma.serviceRequestComment.create({
        data: {
          serviceRequestId: id,
          authorId: ctx.userId ?? null,
          content: `Service request converted to booking #${booking.id.slice(-8).toUpperCase()}. Scheduled for ${bookingScheduledAt.toLocaleDateString()} at ${bookingScheduledAt.toLocaleTimeString()}.`
        }
      })
    } catch {}

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
        assignedTo: booking.assignedTeamMember?.name,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error converting service request to booking:', error)
    return NextResponse.json({ error: 'Internal server error during conversion' }, { status: 500 })
  }
}, { requireAuth: true })
