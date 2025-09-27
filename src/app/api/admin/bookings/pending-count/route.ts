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

    if (!user || !['ADMIN', 'TEAM_LEAD'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Count pending bookings
    const count = await prisma.booking.count({
      where: {
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('Error fetching pending bookings count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}