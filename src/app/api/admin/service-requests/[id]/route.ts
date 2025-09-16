import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'

const UpdateSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  requirements: z.record(z.any()).optional(),
  attachments: z.any().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const item = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, slug: true, category: true } },
      assignedTeamMember: { select: { id: true, name: true, email: true } },
      requestTasks: true,
    },
  })

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:update:${params.id}:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const updates: any = { ...parsed.data }
  if ('deadline' in (parsed.data as any)) {
    updates.deadline = parsed.data.deadline ? new Date(parsed.data.deadline as any) : null
  }

  const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
  const updated = await prisma.serviceRequest.update({ where: { id: params.id }, data: updates })
  try { realtimeService.emitServiceRequestUpdate(updated.id, { action: 'updated' }) } catch {}
  try { if (sr?.clientId) realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: updated.id, action: 'updated' }, timestamp: new Date().toISOString() }) } catch {}
  try { await logAudit({ action: 'service-request:update', actorId: (session.user as any).id ?? null, targetId: params.id, details: { updates } }) } catch {}
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_DELETE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(_req)
  if (!rateLimit(`service-requests:delete:${params.id}:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
  await prisma.requestTask.deleteMany({ where: { serviceRequestId: params.id } })
  await prisma.serviceRequest.delete({ where: { id: params.id } })
  try { realtimeService.emitServiceRequestUpdate(params.id, { action: 'deleted' }) } catch {}
  try { if (sr?.clientId) realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: params.id, action: 'deleted' }, timestamp: new Date().toISOString() }) } catch {}
  try { await logAudit({ action: 'service-request:delete', actorId: (session.user as any).id ?? null, targetId: params.id }) } catch {}
  return NextResponse.json({ success: true })
}
