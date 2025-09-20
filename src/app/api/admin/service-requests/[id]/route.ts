import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const runtime = 'nodejs'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { respond, zodDetails } from '@/lib/api-response'
import { NextRequest } from 'next/server'

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

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  try {
    const item = await prisma.serviceRequest.findUnique({
      where: { id: id },
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
        const item = getRequest(id)
        if (!item) return respond.notFound('Service request not found')
        return respond.ok(item)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:update:${id}:${ip}`, 20, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const updates: any = { ...parsed.data }
  if ('deadline' in (parsed.data as any)) {
    updates.deadline = parsed.data.deadline ? new Date(parsed.data.deadline as any) : null
  }

  const sr = await prisma.serviceRequest.findUnique({ where: { id: id }, select: { clientId: true } })
  const updated = await prisma.serviceRequest.update({ where: { id: id }, data: updates })
  try { realtimeService.emitServiceRequestUpdate(updated.id, { action: 'updated' }) } catch {}
  try { if (sr?.clientId) realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: updated.id, action: 'updated' }, timestamp: new Date().toISOString() }) } catch {}
  try { await logAudit({ action: 'service-request:update', actorId: (session.user as any).id ?? null, targetId: id, details: { updates } }) } catch {}
  return respond.ok(updated)
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_DELETE)) {
    return respond.unauthorized()
  }

  const ip = getClientIp(_req)
  if (!rateLimit(`service-requests:delete:${id}:${ip}`, 10, 60_000)) {
    return respond.tooMany()
  }
  const sr = await prisma.serviceRequest.findUnique({ where: { id: id }, select: { clientId: true } })
  await prisma.requestTask.deleteMany({ where: { serviceRequestId: id } })
  await prisma.serviceRequest.delete({ where: { id: id } })
  try { realtimeService.emitServiceRequestUpdate(id, { action: 'deleted' }) } catch {}
  try { if (sr?.clientId) realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: id, action: 'deleted' }, timestamp: new Date().toISOString() }) } catch {}
  try { await logAudit({ action: 'service-request:delete', actorId: (session.user as any).id ?? null, targetId: id }) } catch {}
  return respond.ok({})
}
