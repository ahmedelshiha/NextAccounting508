import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import * as Sentry from '@sentry/nextjs'
import { validateImportWithSchema } from '@/lib/settings/export'
import { AnalyticsReportingSettingsSchema } from '@/schemas/settings/analytics-reporting'
import analyticsService from '@/services/analytics-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const ip = getClientIp(request as any)
    const key = `analytics-settings:import:${tenantId}:${ip}`
    if (!rateLimit(key, 3, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await request.json().catch(() => ({}))
    const data = validateImportWithSchema(body, AnalyticsReportingSettingsSchema)
    const updated = await analyticsService.upsert(tenantId, data)
    try { await logAudit({ action: 'analytics-settings:import', actorId: ctx.userId, details: { tenantId } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import analytics settings' }, { status: 500 })
  }
})
