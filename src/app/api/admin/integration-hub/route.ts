import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import { IntegrationHubSettingsSchema } from '@/schemas/settings/integration-hub'
import service from '@/services/integration-settings.service'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.INTEGRATION_HUB_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const settings = await service.get(tenantId)
    return NextResponse.json({ settings })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load integration settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.INTEGRATION_HUB_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const body = await request.json().catch(()=>({}))
    const parsed = IntegrationHubSettingsSchema.safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('integration-hub:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await service.get(tenantId).catch(()=>null)
    const saved = await service.update(tenantId, parsed.data, ctx.userId as string)
    try { await prisma.settingChangeDiff.create({ data: { tenantId, userId: ctx.userId ? String(ctx.userId) : null, category: 'integrationHub', resource: 'integration-hub', before: before || null, after: saved || null } }) } catch {}
    try { await prisma.auditEvent.create({ data: { tenantId, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'integration-hub', details: { category: 'integrationHub' } } }) } catch {}
    return NextResponse.json({ settings: saved })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update integration settings' }, { status: 500 })
  }
})
