import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { SystemAdministrationSettingsSchema } from '@/schemas/settings/system-administration'
import systemService from '@/services/system-settings.service'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const settings = await systemService.get(ctx.tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load system settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const parsed = SystemAdministrationSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('system-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await systemService.get(ctx.tenantId).catch(()=>null)
    const updated = await systemService.upsert(ctx.tenantId, parsed.data, ctx.userId)
    try { await prisma.settingChangeDiff.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId ? String(ctx.userId) : null, category: 'systemAdministration', resource: 'system-settings', before: before || null, after: updated || null } }) } catch {}
    try { await prisma.auditEvent.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'system-settings', details: { category: 'systemAdministration' } } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 })
  }
})
