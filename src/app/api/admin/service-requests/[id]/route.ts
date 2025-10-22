import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const runtime = 'nodejs'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { respond, zodDetails } from '@/lib/api-response'
import { NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

const UpdateSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.any().optional(),
})

export const GET = withTenantContext(async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.forbidden('Forbidden')
  }

  try {
    const item = await prisma.serviceRequest.findFirst({
      where: { id, ...getTenantFilter() },
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, slug: true, category: true } },
        assignedTeamMember: { select: { id: true, name: true, email: true } },
        requestTasks: true,
      },
    })

    if (!item) return respond.notFound('Service request not found')
    return respond.ok(item)
  } catch (e: any) {
    const code = String((e as any)?.code || '')
    const msg = String(e?.message || '')
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      try {
        const { getRequest } = await import('@/lib/dev-fallbacks')
        const ctx2 = requireTenantContext()
        const item = getRequest(id)
        if (!item) return respond.notFound('Service request not found')
        // Enforce tenant match in fallback mode as well
        if (item && ctx2?.tenantId && (item as any).tenantId && String((item as any).tenantId) !== String(ctx2.tenantId)) {
          return respond.notFound('Service request not found')
        }
        return respond.ok(item)
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
  const role = ctx.role as string | undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.forbidden('Forbidden')
  }

  const ip = getClientIp(req)
  {
    const key = `service-requests:update:${id}:${ip}`
    const rl = await applyRateLimit(key, 20, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL((req as any).url).pathname } }) } catch {}
      return respond.tooMany()
    }
  }
  // First ensure the service request exists and belongs to the current tenant
  const sr = await prisma.serviceRequest.findFirst({ where: { id, ...getTenantFilter() }, select: { clientId: true } })
  if (!sr) return respond.notFound('Service request not found')

  // Parse and validate payload after tenant ownership check
  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const updates: any = { ...parsed.data }
  if ('deadline' in (parsed.data as any)) {
    updates.deadline = parsed.data.deadline ? new Date(parsed.data.deadline as any) : null
  }

  const updated = await prisma.serviceRequest.update({ where: { id }, data: updates })
  try { realtimeService.emitServiceRequestUpdate(updated.id, { action: 'updated' }) } catch {}
  try { if (sr?.clientId) realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: updated.id, action: 'updated' }, timestamp: new Date().toISOString() }) } catch {}
  try { await logAudit({ action: 'service-request:update', actorId: ctx.userId ?? null, targetId: id, details: { updates } }) } catch {}
  return respond.ok(updated)
})

export const DELETE = withTenantContext(async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_DELETE)) {
    return respond.forbidden('Forbidden')
  }

  const ip = getClientIp(_req)
  {
    const key = `service-requests:delete:${id}:${ip}`
    const rl = await applyRateLimit(key, 10, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(((_req as any).url) || '').pathname } }) } catch {}
      return respond.tooMany()
    }
  }
  const sr = await prisma.serviceRequest.findFirst({ where: { id, ...getTenantFilter() }, select: { clientId: true } })
  if (!sr) return respond.notFound('Service request not found')
  await prisma.requestTask.deleteMany({ where: { serviceRequestId: id } })
  await prisma.serviceRequest.delete({ where: { id } })
  try { realtimeService.emitServiceRequestUpdate(id, { action: 'deleted' }) } catch {}
  try { if (sr?.clientId) realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: id, action: 'deleted' }, timestamp: new Date().toISOString() }) } catch {}
  try { await logAudit({ action: 'service-request:delete', actorId: ctx.userId ?? null, targetId: id }) } catch {}
  return respond.ok({})
})
