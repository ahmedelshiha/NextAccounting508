import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'
import { sumDecimals } from '@/lib/decimal-utils'

// GET /api/admin/stats/bookings - Get booking statistics
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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    // Get total bookings count
    const total = await prisma.booking.count()

    // Get bookings by status
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ where: { status: BookingStatus.CANCELLED } })
    ])

    // Get today's bookings
    const today = await prisma.booking.count({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    })

    // Get this month's bookings
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Get last month's bookings for comparison
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastMonth = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    })

    // Calculate growth percentage
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

    // Get revenue statistics
    const completedBookings = (await prisma.booking.findMany({
      where: { status: BookingStatus.COMPLETED },
      include: {
        service: {
          select: { price: true }
        }
      }
    })) as Array<import('@prisma/client').Booking & { service: { price: unknown } | null }>

    // Use shared decimal utilities to convert and sum prices
    const priceValues = completedBookings.map(
      (b) => b?.service?.price as import('@/lib/decimal-utils').DecimalLike
    )

    const totalRevenue = sumDecimals(priceValues)

    // Get this month's revenue
    const thisMonthRevenue = sumDecimals(
      completedBookings
        .filter(booking => booking.createdAt >= startOfMonth)
        .map(b => b?.service?.price)
    )

    // Get last month's revenue
    const lastMonthRevenue = sumDecimals(
      completedBookings
        .filter(booking => booking.createdAt >= startOfLastMonth && booking.createdAt <= endOfLastMonth)
        .map(b => b?.service?.price)
    )

    const revenueGrowth = lastMonthRevenue > 0 ?
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    // Get upcoming bookings (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcoming = await prisma.booking.count({
      where: {
        scheduledAt: {
          gte: now,
          lte: nextWeek
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        }
      }
    })

    return NextResponse.json({
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today,
      thisMonth,
      lastMonth,
      growth: Math.round(growth * 100) / 100,
      upcoming,
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth: Math.round(revenueGrowth * 100) / 100
      }
    })
  } catch (error) {
    console.error('Error fetching booking statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking statistics' },
      { status: 500 }
    )
  }
}
