import prisma from '@/lib/prisma'
export const runtime = 'nodejs'
import { z } from 'zod'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond, zodDetails } from '@/lib/api-response'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

const CreateCommentSchema = z.object({ content: z.string().min(1), attachments: z.any().optional() })

export const GET = withTenantContext(async (req: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  const sr = await prisma.serviceRequest.findFirst({ where: { id, ...getTenantFilter() } })
  if (!sr) return respond.notFound('Service request not found')

  const comments = await prisma.serviceRequestComment.findMany({
    where: { serviceRequestId: id },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return respond.ok(comments)
})

export const POST = withTenantContext(async (req: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  const ip = getClientIp(req)
  {
    const key = `service-requests:comment:${id}:${ip}`
    const rl = await applyRateLimit(key, 30, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL((req as any).url).pathname } }) } catch {}
      return respond.tooMany()
    }
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateCommentSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const sr = await prisma.serviceRequest.findFirst({ where: { id, ...getTenantFilter() } })
  if (!sr) return respond.notFound('Service request not found')

  const created = await prisma.serviceRequestComment.create({
    data: {
      serviceRequestId: id,
      authorId: ctx.userId ?? null,
      content: parsed.data.content,
      attachments: parsed.data.attachments ?? undefined,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  try { realtimeService.emitServiceRequestUpdate(id, { commentId: created.id, event: 'comment-created' }) } catch {}
  try {
    const srClient = await prisma.serviceRequest.findUnique({ where: { id }, select: { clientId: true } })
    if (srClient?.clientId) {
      const ts = new Date().toISOString()
      realtimeService.broadcastToUser(String(srClient.clientId), { type: 'service-request-updated', data: { serviceRequestId: id, commentId: created.id, event: 'comment-created' }, timestamp: ts })
    }
  } catch {}

  try { await logAudit({ action: 'service-request:comment', actorId: ctx.userId ?? null, targetId: id, details: { commentId: created.id } }) } catch {}
  return respond.created(created)
})
