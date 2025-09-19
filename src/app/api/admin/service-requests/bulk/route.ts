import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

const Schema = z.object({
  action: z.enum(['delete','status']),
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:bulk:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const { action, ids, status } = parsed.data
  const tenantId = getTenantFromRequest(req as any)
  let targetIds = ids
  if (tenantId) {
    try {
      const scoped = await prisma.serviceRequest.findMany({ where: { id: { in: ids }, ...tenantFilter(tenantId) }, select: { id: true } })
      targetIds = scoped.map((s) => s.id)
    } catch {}
  }
  if (action === 'delete') {
    await prisma.requestTask.deleteMany({ where: { serviceRequestId: { in: targetIds } } })
    const result = await prisma.serviceRequest.deleteMany({ where: { id: { in: targetIds } } })
    try { await logAudit({ action: 'service-request:bulk:delete', actorId: (session.user as any).id ?? null, details: { ids, deleted: result.count } }) } catch {}
    return NextResponse.json({ success: true, data: { deleted: result.count } })
  }

  if (action === 'status' && status) {
    const result = await prisma.serviceRequest.updateMany({ where: { id: { in: targetIds } }, data: { status: status as any } })
    try { await logAudit({ action: 'service-request:bulk:status', actorId: (session.user as any).id ?? null, details: { ids, status, updated: result.count } }) } catch {}
    return NextResponse.json({ success: true, data: { updated: result.count } })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
