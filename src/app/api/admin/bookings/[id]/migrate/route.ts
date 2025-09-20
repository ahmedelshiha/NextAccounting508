import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as string | undefined
    const allowed = ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF']
    if (!role || !allowed.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure booking exists
    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Create a ServiceRequest from booking data
    const title = `Appointment: ${booking.id}`
    const payload: any = {
      clientId: booking.clientId || undefined,
      serviceId: booking.serviceId || undefined,
      title: title,
      description: booking.notes || undefined,
      priority: 'MEDIUM',
      // booking fields (if ServiceRequest supports them)
      isBooking: true,
      scheduledAt: booking.scheduledAt ?? undefined,
      duration: booking.duration ?? undefined,
      requirements: { migratedFromBookingId: booking.id },
    }

    const sr = await prisma.serviceRequest.create({ data: payload })

    // Link booking -> serviceRequest
    const updated = await prisma.booking.update({ where: { id }, data: { serviceRequest: { connect: { id: sr.id } } } })

    return NextResponse.json({ success: true, data: { serviceRequest: sr, booking: updated } })
  } catch (error) {
    console.error('Error migrating booking to service request:', error)
    return NextResponse.json({ error: 'Failed to migrate booking' }, { status: 500 })
  }
}
