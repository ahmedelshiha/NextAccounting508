import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

interface CountsResponse {
  pendingBookings: number
  newClients: number
  pendingServiceRequests: number
  overdueTasks: number
}

export const GET = withTenantContext(async (_req: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
})

export const POST = withTenantContext(async () => {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
})
