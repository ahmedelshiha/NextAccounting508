import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { buildExportBundle } from '@/lib/settings/export'
import communicationService from '@/services/communication-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.COMMUNICATION_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ip = getClientIp(req)
    const key = `communication-settings:export:${ctx.tenantId}:${ip}`
    if (!rateLimit(key, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const settings = await communicationService.get(ctx.tenantId)
    return NextResponse.json(buildExportBundle('communication', settings))
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to export communication settings' }, { status: 500 })
  }
})
