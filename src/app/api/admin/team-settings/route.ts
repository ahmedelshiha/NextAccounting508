import { NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import teamService from '@/services/team-settings.service'
import { TeamSettingsSchema } from '@/schemas/settings/team-management'
import * as Sentry from '@sentry/nextjs'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'
import { persistSettingChangeDiff } from '@/lib/settings-diff-helper'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_SETTINGS_VIEW)) {
      return respond.unauthorized()
    }
    const tenantId = ctx.tenantId
    const settings = await teamService.get(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load team settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_SETTINGS_EDIT)) {
      return respond.unauthorized()
    }
    const tenantId = ctx.tenantId
    if (!tenantId) {
      try { Sentry.captureMessage('team-settings:missing_tenant', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const body = await req.json().catch(() => ({}))
    const parsed = TeamSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('team-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await teamService.get(tenantId).catch(() => null)
    const updated = await teamService.upsert(tenantId, parsed.data)

    // Persist change diff and audit event
    await persistSettingChangeDiff({
      tenantId,
      category: 'teamManagement',
      resource: 'team-settings',
      userId: ctx.userId,
      before,
      after: updated,
    })

    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update team settings' }, { status: 500 })
  }
})
