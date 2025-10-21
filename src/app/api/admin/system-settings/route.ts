import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import * as Sentry from '@sentry/nextjs'
import { SystemAdministrationSettingsSchema } from '@/schemas/settings/system-administration'
import systemService from '@/services/system-settings.service'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'
import type { Prisma } from '@prisma/client'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)) return respond.forbidden('Forbidden')
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
    const tenantId = ctx.tenantId
    if (!tenantId) {
      try { Sentry.captureMessage('system-settings:missing_tenant', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const before = await systemService.get(tenantId).catch(()=>null)
    const updated = await systemService.upsert(tenantId, parsed.data, ctx.userId)
    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
        tenantId,
        category: 'systemAdministration',
        resource: 'system-settings',
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      if (before !== null) diffPayload.before = before as Prisma.InputJsonValue
      if (updated !== null && updated !== undefined) diffPayload.after = updated as Prisma.InputJsonValue
      await prisma.settingChangeDiff.create({ data: diffPayload })
    } catch {}
    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const auditPayload: Prisma.AuditEventUncheckedCreateInput = {
        tenantId,
        type: 'settings.update',
        resource: 'system-settings',
        details: { category: 'systemAdministration' } as Prisma.InputJsonValue,
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      await prisma.auditEvent.create({ data: auditPayload })
    } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 })
  }
})
