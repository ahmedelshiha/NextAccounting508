import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import servicesSettingsService, { flattenSettings } from '@/services/services-settings.service'
import { ZodError } from 'zod'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

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

    const before = await servicesSettingsService.getFlat(ctx.tenantId ?? null).catch(()=>null)
    const saved = await servicesSettingsService.save(payload, ctx.tenantId ?? null)
    try { await prisma.settingChangeDiff.create({ data: { tenantId: ctx.tenantId ?? null, userId: ctx.userId ? String(ctx.userId) : null, category: 'serviceManagement', resource: 'services-settings', before: before || null, after: saved || null } }) } catch {}
    try { await prisma.auditEvent.create({ data: { tenantId: ctx.tenantId ?? null, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'services-settings', details: { category: 'serviceManagement' } } }) } catch {}
    return jsonResponse({ ok: true, data: flattenSettings(saved) })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return jsonResponse({ ok: false, error: 'Validation failed', issues: error.format() }, 400)
    }
    return jsonResponse({ ok: false, error: String(error?.message ?? 'Unknown error') }, 500)
  }
})
