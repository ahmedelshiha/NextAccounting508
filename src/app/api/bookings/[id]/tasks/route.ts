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

    // Get tasks related to this booking
    const tasks = await prisma.task.findMany({
      where: { 
        bookingId: id 
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() || null,
      assignedTo: task.assignedUser?.name || null,
      assignedUserId: task.assignedUserId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt?.toISOString() || null
    }))

    return NextResponse.json({ tasks: formattedTasks })
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

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { 
        id: true, 
        clientId: true,
        clientName: true,
        serviceName: true,
        scheduledAt: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Validate assignedTo if provided
    let assignedUserId = null
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: assignedTo },
        select: { id: true, role: true }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 400 }
        )
      }
      
      assignedUserId = user.id
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: 'TODO',
        priority: priority.toUpperCase(),
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedUserId: assignedUserId,
        createdById: session.user.id,
        bookingId: id,
        // Optional: Create a relationship context
        context: {
          bookingId: id,
          clientName: booking.clientName,
          serviceName: booking.serviceName,
          scheduledAt: booking.scheduledAt?.toISOString()
        }
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() || null,
      assignedTo: task.assignedUser?.name || null,
      assignedUserId: task.assignedUserId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt?.toISOString() || null,
      createdBy: task.createdBy.name
    }

    // TODO: Send notification to assigned user
    // This would integrate with the notification system

    return NextResponse.json(formattedTask, { status: 201 })
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