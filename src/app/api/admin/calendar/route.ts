import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { withCache } from '@/lib/api-cache'

/**
 * GET /api/admin/calendar - Fetch calendar data for admin dashboard
 * 
 * Returns aggregated calendar data including:
 * - Bookings with status and team assignments
 * - Tasks with due dates and priorities
 * - Team availability slots
 * 
 * Supports filtering by date range and view type (month/week/day)
 */

// Create cached handler for calendar data
const getCachedCalendar = withCache<any>(
  {
    key: 'admin-calendar',
    ttl: 60, // 1 minute for calendar data
    staleWhileRevalidate: 120, // 2 minutes stale
    tenantAware: true
  },
  async (request: NextRequest): Promise<any> => {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const view = searchParams.get('view') || 'month'
    
    // Calculate date range based on view
    const baseDate = new Date(date)
    let startDate: Date
    let endDate: Date
    
    switch (view) {
      case 'day':
        startDate = new Date(baseDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(baseDate)
        endDate.setHours(23, 59, 59, 999)
        break
        
      case 'week':
        startDate = new Date(baseDate)
        startDate.setDate(baseDate.getDate() - baseDate.getDay())
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
        
      case 'month':
      default:
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999)
        break
    }

    const tenantId = getTenantFromRequest(request as any)

    // Build where clauses respecting actual schema (Booking/AvailabilitySlot are tenanted via Service)
    const bookingWhere: any = {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tenantId ? { service: { tenantId } } : {}),
    }

    // Fetch bookings for the period
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        service: {
          select: {
            name: true,
          },
        },
        assignedTeamMember: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    // Fetch tasks with due dates in the period (Task has no tenant field)
    let tasks: any[] = []
    try {
      tasks = await prisma.task.findMany({
        where: {
          dueAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          assignee: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          dueAt: 'asc',
        },
      })
    } catch (error) {
      // If Task model doesn't exist, provide fallback empty array
      console.warn('Task model not available, using empty array')
      tasks = []
    }

    // Fetch availability slots for the period (tenanted via related Service)
    const availability = await prisma.availabilitySlot.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(tenantId ? { service: { tenantId } } : {}),
      },
      include: {
        teamMember: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    })

    // Transform and return the calendar data
    return {
      bookings: bookings.map(booking => ({
        id: booking.id,
        clientName: booking.clientName,
        service: {
          name: booking.service.name,
        },
        scheduledAt: booking.scheduledAt.toISOString(),
        duration: booking.duration,
        status: booking.status,
        assignedTeamMember: booking.assignedTeamMember ? {
          name: booking.assignedTeamMember.name,
        } : undefined,
      })),
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        dueAt: task.dueAt ? task.dueAt.toISOString() : null,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee ? {
          name: task.assignee.name,
        } : undefined,
      })),
      availability: availability.map(slot => ({
        id: slot.id,
        date: slot.date.toISOString().split('T')[0],
        startTime: slot.startTime,
        endTime: slot.endTime,
        teamMember: {
          name: slot.teamMember?.name || 'Unknown',
        },
        available: slot.available,
      })),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        view,
      },
      summary: {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
        pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
        totalTasks: tasks.length,
        dueTasks: tasks.filter(t => t.dueAt && t.status !== 'COMPLETED').length,
        availableSlots: availability.filter(a => a.available).length,
      },
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !hasPermission(session.user?.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use cached handler for data retrieval
    return getCachedCalendar(request)
    
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}
