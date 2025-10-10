import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import communicationSettingsService from '@/services/communication-settings.service'
import { CommunicationSettingsPatchSchema } from '@/schemas/settings/communication'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

const patchSchema = CommunicationSettingsPatchSchema

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.COMMUNICATION_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const settings = await communicationSettingsService.get(ctx.tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load communication settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.COMMUNICATION_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('communication-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await communicationSettingsService.get(ctx.tenantId).catch(()=>null)
    const updated = await communicationSettingsService.upsert(ctx.tenantId, parsed.data)

    try {
      await prisma.settingChangeDiff.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId ? String(ctx.userId) : null, category: 'communication', resource: 'communication-settings', before: before || null, after: updated || null } })
    } catch {}
    try { await prisma.auditEvent.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'communication-settings', details: { category: 'communication' } } }) } catch {}

    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update communication settings' }, { status: 500 })
  }
})
