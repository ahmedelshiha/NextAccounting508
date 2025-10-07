import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const runtime = 'nodejs'
import { z } from 'zod'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const Schema = z.object({
  action: z.enum(['delete','status']),
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
})

export const POST = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(req)
  {
    const key = `service-requests:bulk:${ip}`
    const rl = await applyRateLimit(key, 10, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL((req as any).url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const { action, ids, status } = parsed.data
  const tenantId = ctx.tenantId
  let targetIds = ids
  try {
    const scoped = await prisma.serviceRequest.findMany({ where: { id: { in: ids }, ...(tenantFilter(tenantId) as any) }, select: { id: true } })
    targetIds = scoped.map((s) => s.id)
  } catch {}

  if (action === 'delete') {
    await prisma.requestTask.deleteMany({ where: { serviceRequestId: { in: targetIds } } })
    const result = await prisma.serviceRequest.deleteMany({ where: { id: { in: targetIds } } })
    try { await logAudit({ action: 'service-request:bulk:delete', actorId: ctx.userId ?? null, details: { ids, deleted: result.count } }) } catch {}
    return NextResponse.json({ success: true, data: { deleted: result.count } })
  }

  if (action === 'status' && status) {
    const result = await prisma.serviceRequest.updateMany({ where: { id: { in: targetIds } }, data: { status: status as any } })
    try { await logAudit({ action: 'service-request:bulk:status', actorId: ctx.userId ?? null, details: { ids, status, updated: result.count } }) } catch {}
    return NextResponse.json({ success: true, data: { updated: result.count } })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
})
