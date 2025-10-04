import { NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { buildExportBundle } from '@/lib/settings/export'
import teamService from '@/services/team-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const ip = getClientIp(req)
    const key = `team-settings:export:${tenantId}:${ip}`
    if (!rateLimit(key, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const settings = await teamService.get(tenantId)
    return NextResponse.json(buildExportBundle('team-management', settings))
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to export team settings' }, { status: 500 })
  }
})
