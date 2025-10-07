import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { respond } from '@/lib/api-response'
import { NextRequest } from 'next/server'
import { isMultiTenancyEnabled } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()

  try {
    const item = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, name: true, slug: true, category: true } },
        comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true, email: true } } } },
      },
    })

    if (!item || item.clientId !== ctx.userId) return respond.notFound('Service request not found')

    if (isMultiTenancyEnabled() && ctx.tenantId && (item as any).tenantId && (item as any).tenantId !== ctx.tenantId) {
      return respond.notFound('Service request not found')
    }

    return respond.ok(item)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:service-requests:[id]:GET' } }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getRequest, getComments } = await import('@/lib/dev-fallbacks')
        const item = getRequest(id)
        if (!item || item.clientId !== ctx.userId) return respond.notFound('Service request not found')
        const comments = getComments(id) || []
        return respond.ok({ ...item, comments })
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export const PATCH = withTenantContext(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()

  const ip = getClientIp(req)
  const key = `portal:service-requests:update:${ip}`
  const updateLimit = await applyRateLimit(key, 10, 60_000)
  if (!updateLimit.allowed) { try { await logAudit({ action: 'security.ratelimit.block', details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL((req as any).url).pathname } }) } catch {} ; return respond.tooMany() }
  const body = await req.json().catch(() => ({} as any))
  const allowed: any = {}
  if (typeof body.description === 'string') allowed.description = body.description
  if (body.action === 'cancel') allowed.status = 'CANCELLED'

  try {
    const existing = await prisma.serviceRequest.findUnique({ where: { id }, select: { clientId: true, status: true, tenantId: true } })
    if (!existing || existing.clientId !== ctx.userId) return respond.notFound('Service request not found')
    if (isMultiTenancyEnabled() && ctx.tenantId && (existing as any).tenantId && (existing as any).tenantId !== ctx.tenantId) return respond.notFound('Service request not found')

    if (body.action === 'approve') {
      if (['CANCELLED','COMPLETED'].includes(existing.status as any)) return respond.badRequest('Cannot approve at current status')
      if (!['SUBMITTED','IN_REVIEW','APPROVED'].includes(existing.status as any)) return respond.badRequest('Approval not applicable')
      allowed.clientApprovalAt = new Date()
      allowed.status = 'APPROVED'
    }

    if (allowed.status === 'CANCELLED' && ['IN_PROGRESS','COMPLETED','CANCELLED'].includes(existing.status as any)) return respond.badRequest('Cannot cancel at current status')

    const updated = await prisma.serviceRequest.update({ where: { id }, data: allowed })
    try { const { realtimeService } = await import('@/lib/realtime-enhanced'); realtimeService.emitServiceRequestUpdate(id) } catch {}
    return respond.ok(updated)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:service-requests:[id]:PATCH' } }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getRequest, updateRequest } = await import('@/lib/dev-fallbacks')
        const existing = getRequest(id)
        if (!existing || existing.clientId !== ctx.userId) return respond.notFound('Service request not found')
        if (isMultiTenancyEnabled() && ctx.tenantId && (existing as any).tenantId && (existing as any).tenantId !== ctx.tenantId) return respond.notFound('Service request not found')
        if (body.action === 'approve') {
          if (['CANCELLED','COMPLETED'].includes(existing.status as any)) return respond.badRequest('Cannot approve at current status')
          if (!['SUBMITTED','IN_REVIEW','APPROVED'].includes(existing.status as any)) return respond.badRequest('Approval not applicable')
          allowed.clientApprovalAt = new Date().toISOString()
          allowed.status = 'APPROVED'
        }
        if (allowed.status === 'CANCELLED' && ['IN_PROGRESS','COMPLETED','CANCELLED'].includes(existing.status as any)) return respond.badRequest('Cannot cancel at current status')
        const updated = updateRequest(id, allowed)
        try { const { realtimeService } = await import('@/lib/realtime-enhanced'); realtimeService.emitServiceRequestUpdate(id) } catch {}
        return respond.ok(updated)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,PATCH,OPTIONS' } })
}
