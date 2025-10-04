import { NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import teamService from '@/services/team-settings.service'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const body = await req.json().catch(() => ({}))
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const updated = await teamService.upsert(tenantId, body as any)
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import team settings' }, { status: 500 })
  }
})
