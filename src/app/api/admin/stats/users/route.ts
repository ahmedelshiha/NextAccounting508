
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

// GET /api/admin/stats/users - Get user statistics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tenantId = getTenantFromRequest(request as unknown as Request)
    const rangeParam = (searchParams.get('range') || '').toLowerCase()
    const days = rangeParam === '7d' ? 7 : rangeParam === '30d' ? 30 : rangeParam === '90d' ? 90 : rangeParam === '1y' ? 365 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get total users count
    const total = await prisma.user.count({ where: tenantFilter(tenantId) })

    // Get users by role
    const [clients, teamMembers, teamLeads, admins] = await Promise.all([
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'CLIENT' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'TEAM_MEMBER' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'TEAM_LEAD' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'ADMIN' } })
    ])
    const staff = teamMembers + teamLeads

    // Get new users this month
    const newThisMonth = await prisma.user.count({
      where: {
        ...tenantFilter(tenantId),
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Get new users last month for comparison
    const newLastMonth = await prisma.user.count({
      where: {
        ...tenantFilter(tenantId),
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
        ...tenantFilter(tenantId),
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
          ...tenantFilter(tenantId),
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
    const topUsers = (await prisma.user.findMany({
      where: {
        ...tenantFilter(tenantId),
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
    })) as Array<import('@prisma/client').User & { _count: { bookings: number } }>

    let ranged: { range?: string; newUsers?: number; growth?: number } = {}
    if (days > 0) {
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)
      const inRange = await prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: start } } })
      const prevRange = await prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: prevStart, lt: start } } })
      const growthRange = prevRange > 0 ? ((inRange - prevRange) / prevRange) * 100 : 0
      ranged = { range: rangeParam, newUsers: inRange, growth: Math.round(growthRange * 100) / 100 }
    }

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
      topUsers: topUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        bookingsCount: user._count.bookings,
        createdAt: user.createdAt
      })),
      range: ranged
    })
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    // Graceful fallback to avoid admin UI failure when DB/schema not available
    return NextResponse.json({
      total: 0,
      clients: 0,
      staff: 0,
      admins: 0,
      newThisMonth: 0,
      newLastMonth: 0,
      growth: 0,
      activeUsers: 0,
      registrationTrends: [],
      topUsers: [],
      range: {}
    })
  }
}
