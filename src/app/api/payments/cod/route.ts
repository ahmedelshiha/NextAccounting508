export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  void ctx
  const body = await request.json().catch(() => null)
  if (!body || !body.serviceId || !body.scheduledAt) {
    return NextResponse.json({ error: 'Missing required fields: serviceId, scheduledAt' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, method: 'COD' })
})
