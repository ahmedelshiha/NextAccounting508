import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/bookings/[id]/comments - Get comments for a booking
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

    // Check if booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { 
        id: true, 
        clientId: true,
        status: true 
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions - clients can only see their own bookings
    if (session.user.role === 'CLIENT' && booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // For now, return empty comments since we don't have a booking comment model yet
    // TODO: Create booking comment model or link to service request comments
    const comments: any[] = []
    
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching booking comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bookings/[id]/comments - Create a comment for a booking
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

    const body = await request.json()
    const { content, isInternal = false, isSystem = false, parentId = null, attachments = null } = body

    if (!content?.trim() && !isSystem) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Check if booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { 
        id: true, 
        clientId: true,
        status: true 
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'CLIENT') {
      // Clients can only comment on their own bookings and cannot post internal comments
      if (booking.clientId !== session.user.id || isInternal) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // For team members, check if they have permission to manage bookings for internal comments
    if (isInternal && !hasPermission(session.user.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for internal comments' },
        { status: 403 }
      )
    }

    // For now, return an error since we don't have a booking comment model yet
    // TODO: Create booking comment model or integrate with service request comments
    return NextResponse.json(
      { error: 'Booking comments feature is not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error creating booking comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id]/comments/[commentId] - Update a comment (for future use)
// DELETE /api/bookings/[id]/comments/[commentId] - Delete a comment (for future use)