import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { FinancialSettingsSchema } from '@/schemas/settings/financial'
import service from '@/services/financial-settings.service'
import { logAudit } from '@/lib/audit'
import { persistSettingChangeDiff } from '@/lib/settings-diff-helper'
import * as Sentry from '@sentry/nextjs'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.FINANCIAL_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const settings = await service.get(ctx.tenantId)
    return NextResponse.json({ settings })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load financial settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.FINANCIAL_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    if (!tenantId) {
      try { Sentry.captureMessage('financial-settings:missing_tenant', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const body = await req.json().catch(() => ({}))
    const parsed = FinancialSettingsSchema.safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('financial-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await service.get(tenantId).catch(() => null)
    const saved = await service.update(tenantId, parsed.data, ctx.userId)

    try { await logAudit({ action: 'financial-settings:update', actorId: ctx.userId, details: { tenantId } }) } catch {}

    // Persist change diff and audit event
    await persistSettingChangeDiff({
      tenantId,
      category: 'financial',
      resource: 'financial-settings',
      userId: ctx.userId,
      before,
      after: saved,
    })

    return NextResponse.json({ settings: saved })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update financial settings' }, { status: 500 })
  }
})
