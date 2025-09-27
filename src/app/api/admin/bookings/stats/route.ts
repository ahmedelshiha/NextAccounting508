import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'TEAM_LEAD', 'STAFF'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get comprehensive booking statistics
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      todayBookings,
      thisMonthBookings,
      lastMonthBookings,
      weekRevenue,
      totalRevenue,
      completedThisMonth,
      completedLastMonth
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count(),

      // Status-based counts
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'NO_SHOW' } }),

      // Today's bookings
      prisma.booking.count({
        where: {
          scheduledAt: {
            gte: startOfToday,
            lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      }),

      // This month bookings
      prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),

      // Last month bookings (for growth calculation)
      prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth
          }
        }
      }),

      // Week revenue from completed bookings
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'COMPLETED',
          scheduledAt: { gte: startOfWeek }
        }
      }),

      // Total revenue from all completed bookings
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' }
      }),

      // Completed bookings this month
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          scheduledAt: {
            gte: startOfMonth
          }
        }
      }),

      // Completed bookings last month
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          scheduledAt: {
            gte: startOfLastMonth,
            lt: startOfMonth
          }
        }
      })
    ])

    // Calculate growth percentage
    const growth = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 
      : thisMonthBookings > 0 ? 100 : 0

    // Calculate completion rate
    const totalScheduled = confirmedBookings + completedBookings + cancelledBookings + noShowBookings
    const completionRate = totalScheduled > 0 ? (completedBookings / totalScheduled) * 100 : 0

    // Calculate average booking value
    const weekRevenueAmount = Number(weekRevenue._sum.totalAmount) || 0
    const totalRevenueAmount = Number(totalRevenue._sum.totalAmount) || 0
    const averageBookingValue = completedBookings > 0 ? totalRevenueAmount / completedBookings : 0

    const stats = {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      noShows: noShowBookings,
      todayBookings,
      weekRevenue: weekRevenueAmount,
      averageBookingValue: Math.round(averageBookingValue),
      completionRate: Math.round(completionRate * 10) / 10,
      growth: Math.round(growth * 10) / 10
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching booking statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}