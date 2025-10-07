import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { logAudit } from '@/lib/audit'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_RESET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = ctx.tenantId
  const ip = getClientIp(req as any)
  const key = `booking-settings:reset:${tenantId}:${ip}`
  const rl = await applyRateLimit(key, 2, 60_000)
  if (!rl.allowed) {
    try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId, ip, key, route: new URL(req.url).pathname } }) } catch {}
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  try {
    const settings = await service.resetToDefaults(tenantId)
    try { await logAudit({ action: 'booking-settings:reset', actorId: ctx.userId, details: { tenantId } }) } catch {}
    return NextResponse.json({ settings })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to reset booking settings' }, { status: 500 })
  }
})
