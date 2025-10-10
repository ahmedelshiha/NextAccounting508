import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { FinancialSettingsSchema } from '@/schemas/settings/financial'
import service from '@/services/financial-settings.service'
import { logAudit } from '@/lib/audit'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

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
    const body = await req.json().catch(() => ({}))
    const parsed = FinancialSettingsSchema.safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('financial-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await service.get(ctx.tenantId).catch(()=>null)
    const saved = await service.update(ctx.tenantId, parsed.data, ctx.userId)

    // Persist change diff and audit event (best-effort)
    try {
      const changes = jsonDiff(before || {}, saved || {})
      await prisma.settingChangeDiff.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId ? String(ctx.userId) : null,
          category: 'financial',
          resource: 'financial-settings',
          before: before || null,
          after: saved || null,
        },
      })
    } catch {}

    try { await logAudit({ action: 'financial-settings:update', actorId: ctx.userId, details: { tenantId: ctx.tenantId } }) } catch {}
    try {
      await prisma.auditEvent.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'financial-settings', details: { category: 'financial' } } })
    } catch {}

    return NextResponse.json({ settings: saved })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update financial settings' }, { status: 500 })
  }
})
