import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import analyticsService from '@/services/analytics-settings.service'
import { AnalyticsReportingSettingsSchema } from '@/schemas/settings/analytics-reporting'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

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
    const body = await request.json().catch(() => ({}))
    const parsed = AnalyticsReportingSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('analytics-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await analyticsService.get(tenantId).catch(()=>null)
    const updated = await analyticsService.upsert(tenantId, parsed.data)
    try { await prisma.settingChangeDiff.create({ data: { tenantId, userId: ctx.userId ? String(ctx.userId) : null, category: 'analyticsReporting', resource: 'analytics-settings', before: before || null, after: updated || null } }) } catch {}
    try { await prisma.auditEvent.create({ data: { tenantId, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'analytics-settings', details: { category: 'analyticsReporting' } } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update analytics settings' }, { status: 500 })
  }
})
