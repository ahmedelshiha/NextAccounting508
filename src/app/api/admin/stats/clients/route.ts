import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get client statistics
    const [
      totalClients,
      activeClients,
      newThisMonth,
      newLastMonth,
      bookingStats,
      revenueStats
    ] = await Promise.all([
      // Total clients
      prisma.user.count({
        where: { role: 'CLIENT' }
      }),

      // Active clients (simplified count - TODO: add proper booking relationship)
      prisma.user.count({
        where: {
          role: 'CLIENT'
        }
      }),

      // New clients this month
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: firstDayOfMonth
          }
        }
      }),

      // New clients last month (for growth calculation)
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth
          }
        }
      }),

      // Booking statistics
      prisma.booking.aggregate({
        _count: true,
        where: {
          client: { role: 'CLIENT' }
        }
      }),

      // Revenue statistics (using duration as placeholder for totalAmount)
      prisma.booking.aggregate({
        _sum: {
          duration: true
        },
        where: {
          client: { role: 'CLIENT' },
          status: 'COMPLETED'
        }
      })
    ])

    // Calculate growth percentage
    const growth = newLastMonth > 0 
      ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 
      : newThisMonth > 0 ? 100 : 0

    // Calculate average revenue per client (using duration as placeholder)
    const totalRevenue = Number(revenueStats._sum.duration) || 0
    const averageRevenue = totalClients > 0 ? totalRevenue / totalClients : 0

    // Calculate retention rate (simplified - TODO: implement proper booking relationship)
    const clientsWithMultipleBookings = Math.floor(totalClients * 0.6) // Mock data
    
    const retention = totalClients > 0 ? (clientsWithMultipleBookings / totalClients) * 100 : 0

    // Calculate average satisfaction (mock data - would need actual satisfaction surveys)
    const satisfaction = 4.2 // This would come from actual satisfaction surveys

    const stats = {
      total: totalClients,
      active: activeClients,
      newThisMonth,
      totalRevenue,
      averageRevenue: Math.round(averageRevenue),
      retention: Math.round(retention * 10) / 10,
      satisfaction,
      growth: Math.round(growth * 10) / 10
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching client statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}