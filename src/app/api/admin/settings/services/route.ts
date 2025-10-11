import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import servicesSettingsService, { flattenSettings } from '@/services/services-settings.service'
import { ZodError } from 'zod'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'
import type { Prisma } from '@prisma/client'

function jsonResponse(payload: any, status = 200) {
  return NextResponse.json(payload, { status })
}

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SERVICES_VIEW)) {
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403)
    }

    const data = await servicesSettingsService.getFlat(ctx.tenantId ?? null)
    return jsonResponse({ ok: true, data })
  } catch (error: any) {
    return jsonResponse({ ok: false, error: String(error?.message ?? 'Unknown error') }, 500)
  }
})

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SERVICES_EDIT)) {
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403)
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return jsonResponse({ ok: false, error: 'Tenant context missing' }, 400)
    }

    const before = await servicesSettingsService.getFlat(tenantId).catch(()=>null)
    const saved = await servicesSettingsService.save(payload, tenantId)

    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
        tenantId,
        category: 'serviceManagement',
        resource: 'services-settings',
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      if (before !== null) diffPayload.before = before as Prisma.InputJsonValue
      if (saved !== null && saved !== undefined) diffPayload.after = saved as Prisma.InputJsonValue
      await prisma.settingChangeDiff.create({ data: diffPayload })
    } catch {}

    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const auditPayload: Prisma.AuditEventUncheckedCreateInput = {
        tenantId,
        type: 'settings.update',
        resource: 'services-settings',
        details: { category: 'serviceManagement' } as Prisma.InputJsonValue,
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      await prisma.auditEvent.create({ data: auditPayload })
    } catch {}

    return jsonResponse({ ok: true, data: flattenSettings(saved) })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return jsonResponse({ ok: false, error: 'Validation failed', issues: error.format() }, 400)
    }
    return jsonResponse({ ok: false, error: String(error?.message ?? 'Unknown error') }, 500)
  }
})
