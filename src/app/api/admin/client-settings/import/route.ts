import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import * as Sentry from '@sentry/nextjs'
import { validateImportWithSchema } from '@/lib/settings/export'
import { ClientManagementSettingsSchema } from '@/schemas/settings/client-management'
import clientService from '@/services/client-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.CLIENT_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const ip = getClientIp(request as any)
    const key = `client-settings:import:${tenantId}:${ip}`
    if (!rateLimit(key, 3, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await request.json().catch(() => ({}))
    const data = validateImportWithSchema(body, ClientManagementSettingsSchema)
    const updated = await clientService.upsert(tenantId, data)
    try { await logAudit({ action: 'client-settings:import', actorId: ctx.userId, details: { tenantId } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import client settings' }, { status: 500 })
  }
})
