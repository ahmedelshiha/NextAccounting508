export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'

// WebSocket endpoint disabled on this deployment plan due to Edge size limits.
// Please use the SSE endpoint at /api/portal/realtime for realtime updates.

export const GET = withTenantContext(async () => {
  return NextResponse.json(
    { error: 'WebSocket endpoint unavailable on current plan. Use SSE at /api/portal/realtime' },
    { status: 426 }
  )
}, { requireAuth: false })
