import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const runtime = 'nodejs'

const CreateSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.any().optional(),
})

export const GET = withTenantContext(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()

  try {
    const reqRow = await prisma.serviceRequest.findUnique({ where: { id }, select: { clientId: true, tenantId: true } })
    if (!reqRow || reqRow.clientId !== ctx.userId) {
      return respond.notFound('Service request not found')
    }
    if ((reqRow as any).tenantId && (reqRow as any).tenantId !== ctx.tenantId) {
      return respond.notFound('Service request not found')
    }

    const comments = await prisma.serviceRequestComment.findMany({
      where: { serviceRequestId: id },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    })

    return respond.ok(comments)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:service-requests:[id]:comments:GET' } }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getRequest, getComments } = await import('@/lib/dev-fallbacks')
        const reqRow = getRequest(id)
        if (!reqRow || reqRow.clientId !== ctx.userId) return respond.notFound('Service request not found')
        const comments = getComments(id) || []
        return respond.ok(comments)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export const POST = withTenantContext(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()

  const reqRow = await prisma.serviceRequest.findUnique({ where: { id }, select: { clientId: true, tenantId: true } })
  if (!reqRow || reqRow.clientId !== ctx.userId) {
    return respond.notFound('Service request not found')
  }
  if ((reqRow as any).tenantId && (reqRow as any).tenantId !== ctx.tenantId) {
    return respond.notFound('Service request not found')
  }

  const ip = getClientIp(req as any)
  const commentLimit = await applyRateLimit(`portal:service-requests:comment:${ip}`, 10, 60_000)
  if (!commentLimit.allowed) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  try {
    const created = await prisma.serviceRequestComment.create({
      data: {
        serviceRequestId: id,
        authorId: String(ctx.userId),
        content: parsed.data.content,
        attachments: parsed.data.attachments ?? undefined,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    })

    try {
      const { realtimeService } = await import('@/lib/realtime-enhanced')
      realtimeService.emitServiceRequestUpdate(id)
    } catch {}

    return respond.created(created)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:service-requests:[id]:comments:POST' } }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { addComment, getRequest } = await import('@/lib/dev-fallbacks')
        const reqRow = getRequest(id)
        if (!reqRow || reqRow.clientId !== ctx.userId) return respond.notFound('Service request not found')
        const comment = { id: `dev-c-${Date.now().toString()}`, content: parsed.data.content, createdAt: new Date().toISOString(), author: { id: String(ctx.userId), name: undefined } }
        addComment(id, comment)
        try {
          const { realtimeService } = await import('@/lib/realtime-enhanced')
          realtimeService.emitServiceRequestUpdate(id)
        } catch {}
        return respond.created(comment)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,POST,OPTIONS' } })
}
