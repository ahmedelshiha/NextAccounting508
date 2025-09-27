import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/bookings/[id]/tasks - Get tasks related to a booking
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

    // For now, return empty tasks since we don't have a bookingId field in Task model
    // TODO: Add bookingId field to Task model or create TaskBooking relationship
    const tasks: any[] = []
    
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching booking tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bookings/[id]/tasks - Create a task related to a booking
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

    // Check if user has permission to create tasks
    if (!hasPermission(session.user.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tasks' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, priority = 'NORMAL', dueDate, assignedTo } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    // For now, return an error since we don't have proper task-booking integration in schema
    // TODO: Add proper task-booking relationship to the database schema
    return NextResponse.json(
      { error: 'Task creation for bookings is not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error creating booking task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id]/tasks/[taskId] - Update task status (for future use)
// DELETE /api/bookings/[id]/tasks/[taskId] - Delete a task (for future use)