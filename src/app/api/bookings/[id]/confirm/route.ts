import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBookingConfirmation } from '@/lib/email'

// POST /api/bookings/[id]/confirm - Confirm booking and send email
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin/staff can confirm bookings
    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: id },
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

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking status to confirmed
    const updatedBooking = await prisma.booking.update({
      where: { id: id },
      data: {
        status: 'CONFIRMED',
        confirmed: true,
        confirmedAt: new Date()
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
            price: true
          }
        }
      }
    })

    // Send confirmation email
    try {
      await sendBookingConfirmation({
        id: updatedBooking.id,
        scheduledAt: updatedBooking.scheduledAt,
        duration: updatedBooking.duration,
        clientName: updatedBooking.clientName,
        clientEmail: updatedBooking.clientEmail,
        service: {
          name: updatedBooking.service.name,
          price: updatedBooking.service.price
        }
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      message: 'Booking confirmed successfully',
      booking: updatedBooking
    })
  } catch (error) {
    console.error('Error confirming booking:', error)
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    )
  }
}
