import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { logAudit } from '@/lib/audit'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_IMPORT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = ctx.tenantId
  const ip = getClientIp(req as any)
  const key = `booking-settings:import:${tenantId}:${ip}`
  if (!rateLimit(key, 3, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  try {
    const settings = await service.importSettings(tenantId, body)
    try { await logAudit({ action: 'booking-settings:import', actorId: ctx.userId, details: { tenantId } }) } catch {}
    return NextResponse.json({ settings })
  } catch (e: any) {
    try { Sentry.captureException(e) } catch {}
    return NextResponse.json({ error: e?.message || 'Failed to import settings' }, { status: 500 })
  }
})
