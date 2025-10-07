import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { validateImportWithSchema } from '@/lib/settings/export'
import { CommunicationSettingsSchema } from '@/schemas/settings/communication'
import communicationService from '@/services/communication-settings.service'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.COMMUNICATION_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ip = getClientIp(req)
    const key = `communication-settings:import:${ctx.tenantId}:${ip}`
    const rl = await applyRateLimit(key, 3, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL((req as any).url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const data = validateImportWithSchema(body, CommunicationSettingsSchema)
    const updated = await communicationService.upsert(ctx.tenantId, data)
    try { await logAudit({ action: 'communication-settings:import', actorId: ctx.userId, details: { tenantId: ctx.tenantId } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import communication settings' }, { status: 500 })
  }
})
