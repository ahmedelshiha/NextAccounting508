export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body || !body.serviceId || !body.scheduledAt) {
    return NextResponse.json({ error: 'Missing required fields: serviceId, scheduledAt' }, { status: 400 })
  }
  // For COD we currently just acknowledge the selection. Booking creation persists payment method in requirements.
  return NextResponse.json({ ok: true, method: 'COD' })
}
