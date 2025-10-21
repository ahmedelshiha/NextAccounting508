import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import communicationSettingsService from '@/services/communication-settings.service'
import { CommunicationSettingsPatchSchema } from '@/schemas/settings/communication'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

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
    const tenantId = ctx.tenantId
    if (!tenantId) {
      try { Sentry.captureMessage('communication-settings:missing_tenant', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const body = await req.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('communication-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await communicationSettingsService.get(tenantId).catch(() => null)
    const updated = await communicationSettingsService.upsert(tenantId, parsed.data)

    const actorUserId = ctx.userId ? String(ctx.userId) : undefined
    const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
      tenantId,
      category: 'communication',
      resource: 'communication-settings',
      ...(actorUserId ? { userId: actorUserId } : {}),
    }
    if (before !== null) {
      diffPayload.before = before as Prisma.InputJsonValue
    }
    diffPayload.after = updated as Prisma.InputJsonValue

    const auditPayload: Prisma.AuditEventUncheckedCreateInput = {
      tenantId,
      type: 'settings.update',
      resource: 'communication-settings',
      details: { category: 'communication' } as Prisma.InputJsonValue,
      ...(actorUserId ? { userId: actorUserId } : {}),
    }

    try {
      await prisma.settingChangeDiff.create({ data: diffPayload })
    } catch {}
    try { await prisma.auditEvent.create({ data: auditPayload }) } catch {}

    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update communication settings' }, { status: 500 })
  }
})
