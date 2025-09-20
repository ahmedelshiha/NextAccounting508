import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = (searchParams.get('range') || '14d').toLowerCase()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '1y' ? 365 : 14

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({
        dailyBookings: Array.from({ length: days }).map((_, i) => ({ day: i, count: Math.floor(Math.random() * 5) })),
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
    const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)

    // Tenant scoping
    const tenantId = getTenantFromRequest(request as any)

    // Daily bookings for selected range
    const bookings = await prisma.booking.findMany({
      where: { ...tenantFilter(tenantId), createdAt: { gte: startDate } },
      select: { createdAt: true },
    })
    const dailyMap = new Map<string, number>()
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dailyMap.set(key, 0)
    }
    bookings.forEach(b => {
      const key = b.createdAt.toISOString().slice(0, 10)
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
    })
    const dailyBookings = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))

    // Revenue by service within range (completed bookings)
    const completed = await prisma.booking.findMany({
      where: { ...tenantFilter(tenantId), status: 'COMPLETED', createdAt: { gte: startDate } },
      include: { service: { select: { name: true, price: true } } },
    })
    const revenueByServiceMap = new Map<string, number>()
    completed.forEach(b => {
      const name = b.service?.name || 'Unknown'
      const amount = Number((b.service?.price as unknown as { toString: () => string })?.toString?.() || 0)
      revenueByServiceMap.set(name, (revenueByServiceMap.get(name) || 0) + amount)
    })
    const revenueByService = Array.from(revenueByServiceMap.entries()).map(([service, amount]) => ({ service, amount }))

    // Average lead time (days) between creation and scheduledAt within range
    const withLeadTimes = await prisma.booking.findMany({ select: { createdAt: true, scheduledAt: true }, where: { ...tenantFilter(tenantId), createdAt: { gte: startDate } } })
    const leadTimes = withLeadTimes.map(b => (b.scheduledAt.getTime() - b.createdAt.getTime()) / (24 * 60 * 60 * 1000)).filter(n => isFinite(n) && n >= 0)
    const avgLeadTimeDays = leadTimes.length ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0

    // Top services by booking count within range
    const servicesWithCounts = await prisma.booking.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      where: { ...tenantFilter(tenantId), createdAt: { gte: startDate } }
    })
    const serviceIds = servicesWithCounts.map(s => s.serviceId).filter((id): id is string => !!id)
    const services = await prisma.service.findMany({ where: { ...tenantFilter(tenantId), id: { in: serviceIds } }, select: { id: true, name: true } })
    const topServices = servicesWithCounts
      .map(s => ({ service: services.find(x => x.id === s.serviceId)?.name || 'Unknown', bookings: s._count.serviceId }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    return NextResponse.json({ dailyBookings, revenueByService, avgLeadTimeDays, topServices })
  } catch (e) {
    console.error('Analytics error', e)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
