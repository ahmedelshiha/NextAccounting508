import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = ctx.tenantId
    const rangeParam = (searchParams.get('range') || '').toLowerCase()
    const days = rangeParam === '7d' ? 7 : rangeParam === '30d' ? 30 : rangeParam === '90d' ? 90 : rangeParam === '1y' ? 365 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const total = await prisma.user.count({ where: tenantFilter(tenantId) })

    const [clients, teamMembers, teamLeads, admins] = await Promise.all([
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'CLIENT' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'TEAM_MEMBER' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'TEAM_LEAD' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'ADMIN' } })
    ])
    const staff = teamMembers + teamLeads

    const newThisMonth = await prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: startOfMonth } } })

    const newLastMonth = await prisma.user.count({
      where: { ...tenantFilter(tenantId), createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    })

    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const usersWithRecentBookings = await prisma.user.count({
      where: { ...tenantFilter(tenantId), bookings: { some: { createdAt: { gte: thirtyDaysAgo } } } }
    })

    const registrationTrends: Array<{ month: string; count: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const count = await prisma.user.count({
        where: { ...tenantFilter(tenantId), createdAt: { gte: monthStart, lte: monthEnd } }
      })

      registrationTrends.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        count
      })
    }

    const topUsers = (await prisma.user.findMany({
      where: { ...tenantFilter(tenantId), role: 'CLIENT' },
      include: { _count: { select: { bookings: true } } },
      orderBy: { bookings: { _count: 'desc' } },
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
})
