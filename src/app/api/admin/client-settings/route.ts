import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import clientService from '@/services/client-settings.service'
import { ClientManagementSettingsSchema } from '@/schemas/settings/client-management'
import { persistSettingChangeDiff } from '@/lib/settings-diff-helper'
import * as Sentry from '@sentry/nextjs'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.CLIENT_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const settings = await clientService.get(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load client settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.CLIENT_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    if (!tenantId) {
      try { Sentry.captureMessage('client-settings:missing_tenant', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const parsed = ClientManagementSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('client-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const before = await clientService.get(tenantId).catch(() => null)
    const updated = await clientService.upsert(tenantId, parsed.data)

    // Persist change diff and audit event
    await persistSettingChangeDiff({
      tenantId,
      category: 'client',
      resource: 'client-settings',
      userId: ctx.userId,
      before,
      after: updated,
    })

    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update client settings' }, { status: 500 })
  }
})
