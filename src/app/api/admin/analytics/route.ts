import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  void request
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || !hasPermission(role, 'view_analytics')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({
        dailyBookings: Array.from({ length: 14 }).map((_, i) => ({ day: i, count: Math.floor(Math.random() * 5) })),
        revenueByService: [
          { service: 'Bookkeeping', amount: 4200 },
          { service: 'Tax Preparation', amount: 5800 },
          { service: 'Payroll', amount: 2200 },
        ],
        avgLeadTimeDays: 4.2,
        topServices: [
          { service: 'Tax Preparation', bookings: 18 },
          { service: 'Bookkeeping', bookings: 12 },
        ],
      })
    }

    // With DB
    const now = new Date()
    const twoWeeksAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000)

    // Daily bookings for last 14 days
    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true },
    })
    const dailyMap = new Map<string, number>()
    for (let i = 0; i < 14; i++) {
      const d = new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dailyMap.set(key, 0)
    }
    bookings.forEach(b => {
      const key = b.createdAt.toISOString().slice(0, 10)
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
    })
    const dailyBookings = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))

    // Revenue by service (completed bookings)
    const completed = await prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      include: { service: { select: { name: true, price: true } } },
    })
    const revenueByServiceMap = new Map<string, number>()
    completed.forEach(b => {
      const name = b.service?.name || 'Unknown'
      const amount = Number((b.service?.price as unknown as { toString: () => string })?.toString?.() || 0)
      revenueByServiceMap.set(name, (revenueByServiceMap.get(name) || 0) + amount)
    })
    const revenueByService = Array.from(revenueByServiceMap.entries()).map(([service, amount]) => ({ service, amount }))

    // Average lead time (days) between creation and scheduledAt
    const withLeadTimes = await prisma.booking.findMany({ select: { createdAt: true, scheduledAt: true } })
    const leadTimes = withLeadTimes.map(b => (b.scheduledAt.getTime() - b.createdAt.getTime()) / (24 * 60 * 60 * 1000)).filter(n => isFinite(n) && n >= 0)
    const avgLeadTimeDays = leadTimes.length ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0

    // Top services by booking count
    const topServiceCounts = await prisma.service.findMany({ select: { name: true, _count: { select: { bookings: true } } } }) as Array<{ name: string; _count: { bookings: number } }>
    const topServices = topServiceCounts
      .map(s => ({ service: s.name, bookings: s._count.bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    return NextResponse.json({ dailyBookings, revenueByService, avgLeadTimeDays, topServices })
  } catch (e) {
    console.error('Analytics error', e)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
