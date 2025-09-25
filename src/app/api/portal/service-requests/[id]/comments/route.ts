import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'
import { NextRequest } from 'next/server'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'

export const runtime = 'nodejs'

const CreateSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.any().optional(),
})

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()
  const tenantId = getTenantFromRequest(req as any)

  try {
    const reqRow = await prisma.serviceRequest.findUnique({ where: { id: id }, select: { clientId: true, tenantId: true } })
    if (!reqRow || reqRow.clientId !== session.user.id) {
      return respond.notFound('Service request not found')
    }
    if (isMultiTenancyEnabled() && tenantId && (reqRow as any).tenantId && (reqRow as any).tenantId !== tenantId) {
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
        if (!reqRow || reqRow.clientId !== session.user.id) return respond.notFound('Service request not found')
        const comments = getComments(id) || []
        return respond.ok(comments)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()
  const tenantId = getTenantFromRequest(req as any)

  const reqRow = await prisma.serviceRequest.findUnique({ where: { id: id }, select: { clientId: true, tenantId: true } })
  if (!reqRow || reqRow.clientId !== session.user.id) {
    return respond.notFound('Service request not found')
    }
    if (isMultiTenancyEnabled() && tenantId && (reqRow as any).tenantId && (reqRow as any).tenantId !== tenantId) {
      return respond.notFound('Service request not found')
    }

  const ip = getClientIp(req)
  if (!rateLimit(`portal:service-requests:comment:${ip}`, 10, 60_000)) {
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
        authorId: session.user.id,
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
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:service-requests:[id]:comments:POST' }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { addComment, getRequest } = await import('@/lib/dev-fallbacks')
        const reqRow = getRequest(id)
        if (!reqRow || reqRow.clientId !== session.user.id) return respond.notFound('Service request not found')
        const comment = { id: `dev-c-${Date.now().toString()}`, content: parsed.data.content, createdAt: new Date().toISOString(), author: { id: session.user.id, name: session.user.name } }
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
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,POST,OPTIONS' } })
}
