import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import * as Sentry from '@sentry/nextjs'
import { buildExportBundle } from '@/lib/settings/export'
import clientService from '@/services/client-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.CLIENT_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const ip = getClientIp(request as any)
    const key = `client-settings:export:${tenantId}:${ip}`
    if (!rateLimit(key, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const settings = await clientService.get(tenantId)
    return NextResponse.json(buildExportBundle('client-management', settings))
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to export client settings' }, { status: 500 })
  }
})
