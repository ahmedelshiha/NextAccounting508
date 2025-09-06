import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/stats/users - Get user statistics
export async function GET(request: NextRequest) {
  void request
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get total users count
    const total = await prisma.user.count()

    // Get users by role
    const [clients, staff, admins] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'STAFF' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ])

    // Get new users this month
    const newThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Get new users last month for comparison
    const newLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    })

    // Calculate growth percentage
    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0

    // Get active users (users who have made bookings or logged in recently)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Users with recent bookings
    const usersWithRecentBookings = await prisma.user.count({
      where: {
        bookings: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    })

    // Get user registration trends (last 6 months)
    const registrationTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      registrationTrends.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        count
      })
    }

    // Get users with most bookings
    const topUsers = await prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      },
      take: 5
    })

    return NextResponse.json({
      total,
      clients,
      staff,
      admins,
      newThisMonth,
      newLastMonth,
      growth: Math.round(growth * 100) / 100,
      activeUsers: usersWithRecentBookings,
      registrationTrends,
      topUsers: topUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        bookingsCount: user._count.bookings,
        createdAt: user.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
}
