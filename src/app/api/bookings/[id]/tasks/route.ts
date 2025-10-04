import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/bookings/[id]/tasks - Get tasks related to a booking
export const GET = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()
    if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, clientId: true, status: true } })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (ctx.role === 'CLIENT' && booking.clientId !== ctx.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tasks: any[] = []
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching booking tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// POST /api/bookings/[id]/tasks - Create a task related to a booking
export const POST = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()
    if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Insufficient permissions to create tasks' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, priority = 'NORMAL', dueDate, assignedTo } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Task title is required' }, { status: 400 })

    return NextResponse.json({ error: 'Task creation for bookings is not yet implemented' }, { status: 501 })
  } catch (error) {
    console.error('Error creating booking task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
