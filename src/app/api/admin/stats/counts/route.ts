import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface CountsResponse {
  pendingBookings: number
  newClients: number
  pendingServiceRequests: number
  overdueTasks: number
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Basic sample counts; in production, compute from DB
    const data: CountsResponse = {
      pendingBookings: 3,
      newClients: 2,
      pendingServiceRequests: 1,
      overdueTasks: 4,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
