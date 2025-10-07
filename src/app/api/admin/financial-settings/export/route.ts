import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { buildExportBundle } from '@/lib/settings/export'
import service from '@/services/financial-settings.service'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.FINANCIAL_SETTINGS_EXPORT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ip = getClientIp(req)
    const key = `financial-settings:export:${ctx.tenantId}:${ip}`
    const rl = await applyRateLimit(key, 10, 60_000)
    if (!rl.allowed) {
      try { const { logAudit } = await import('@/lib/audit'); await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL((req as any).url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const settings = await service.get(ctx.tenantId)
    return NextResponse.json(buildExportBundle('financial', settings))
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to export financial settings' }, { status: 500 })
  }
})
