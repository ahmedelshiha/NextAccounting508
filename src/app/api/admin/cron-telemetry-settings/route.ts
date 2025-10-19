import { NextResponse, NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getCronTelemetrySettings, updateCronTelemetrySettings } from '@/services/cron-telemetry-settings.service'
import { CronTelemetrySettingsSchema } from '@/schemas/settings/cron-telemetry'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const settings = await getCronTelemetrySettings(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    console.error('Failed to get cron telemetry settings:', e)
    return NextResponse.json({ error: 'Failed to load cron telemetry settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = CronTelemetrySettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const before = await getCronTelemetrySettings(tenantId)
    const updated = await updateCronTelemetrySettings(tenantId, parsed.data)

    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
        tenantId,
        category: 'cronTelemetry',
        resource: 'cron-telemetry-settings',
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
        resource: 'cron-telemetry-settings',
        details: { category: 'cronTelemetry' } as Prisma.InputJsonValue,
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      await prisma.auditEvent.create({ data: auditPayload })
    } catch {}

    return NextResponse.json(updated)
  } catch (e) {
    console.error('Failed to update cron telemetry settings:', e)
    return NextResponse.json({ error: 'Failed to update cron telemetry settings' }, { status: 500 })
  }
})
