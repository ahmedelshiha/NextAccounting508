import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import analyticsService from '@/services/analytics-settings.service'
import { AnalyticsReportingSettingsSchema } from '@/schemas/settings/analytics-reporting'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const settings = await analyticsService.get(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load analytics settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    if (!tenantId) {
      try { Sentry.captureMessage('analytics-settings:missing_tenant', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const parsed = AnalyticsReportingSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('analytics-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await analyticsService.get(tenantId).catch(() => null)
    const updated = await analyticsService.upsert(tenantId, parsed.data)
    const actorUserId = ctx.userId ? String(ctx.userId) : undefined
    const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
      tenantId,
      category: 'analyticsReporting',
      resource: 'analytics-settings',
      ...(actorUserId ? { userId: actorUserId } : {}),
    }
    if (before !== null) {
      diffPayload.before = before as Prisma.InputJsonValue
    }
    diffPayload.after = updated as Prisma.InputJsonValue
    const auditPayload: Prisma.AuditEventUncheckedCreateInput = {
      tenantId,
      type: 'settings.update',
      resource: 'analytics-settings',
      details: { category: 'analyticsReporting' } as Prisma.InputJsonValue,
      ...(actorUserId ? { userId: actorUserId } : {}),
    }
    try { await prisma.settingChangeDiff.create({ data: diffPayload }) } catch {}
    try { await prisma.auditEvent.create({ data: auditPayload }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update analytics settings' }, { status: 500 })
  }
})
