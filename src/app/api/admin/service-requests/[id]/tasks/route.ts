import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { realtimeService } from '@/lib/realtime-enhanced'
import { respond, zodDetails } from '@/lib/api-response'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'
import { NextRequest } from 'next/server'

const hasDb = !!process.env.NETLIFY_DATABASE_URL
const mem: { bySr: Record<string, any[]> } = { bySr: {} }

const PriorityEnum = z.enum(['LOW','MEDIUM','HIGH'])
const CreateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.union([PriorityEnum, z.enum(['low','medium','high','critical'])]).optional(),
  dueAt: z.string().datetime().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

function mapPriority(v?: string | null) {
  if (!v) return 'MEDIUM'
  const s = String(v).toUpperCase()
  if (s === 'LOW') return 'LOW'
  if (s === 'HIGH' || s === 'CRITICAL') return 'HIGH'
  return 'MEDIUM'
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) return respond.unauthorized()

  const tenantId = getTenantFromRequest(req as any)
  if (hasDb) {
    const sr = await prisma.serviceRequest.findUnique({ where: { id } })
    if (!sr) return respond.notFound('Service request not found')
    if (isMultiTenancyEnabled() && tenantId && (sr as any).tenantId && (sr as any).tenantId !== tenantId) {
      return respond.notFound('Service request not found')
    }
  }

  if (!hasDb) {
    const rows = mem.bySr[id] || []
    return respond.ok(rows)
  }

  const relations = await prisma.requestTask.findMany({
    where: { serviceRequestId: id },
    include: {
      task: {
        include: { assignee: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return respond.ok(relations.map((r) => r.task))
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_CREATE)) return respond.unauthorized()

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:task-create:${id}:${ip}`, 20, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateTaskSchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  const priority = mapPriority(parsed.data.priority as any)
  const dueIso = parsed.data.dueAt || (parsed.data.dueDate ? new Date(parsed.data.dueDate).toISOString() : undefined)

  const tenantId = getTenantFromRequest(req as any)
  if (hasDb) {
    const sr = await prisma.serviceRequest.findUnique({ where: { id } })
    if (!sr) return respond.notFound('Service request not found')
    if (isMultiTenancyEnabled() && tenantId && (sr as any).tenantId && (sr as any).tenantId !== tenantId) {
      return respond.notFound('Service request not found')
    }
  }

  if (!hasDb) {
    const now = new Date()
    const genId = (globalThis as any).crypto && typeof (globalThis as any).crypto.randomUUID === 'function'
      ? (globalThis as any).crypto.randomUUID()
      : Math.random().toString(36).slice(2)
    const row = {
      id: genId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority,
      dueAt: dueIso || null,
      assigneeId: parsed.data.assigneeId ?? null,
      assignee: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    mem.bySr[id] = mem.bySr[id] || []
    mem.bySr[id].unshift(row)

    try { realtimeService.emitTaskUpdate(row.id, { action: 'created', serviceRequestId: id }) } catch {}
    try { realtimeService.emitServiceRequestUpdate(id, { action: 'task-created', taskId: row.id }) } catch {}
    try { await logAudit({ action: 'service-request:task:create', actorId: (session.user as any).id ?? null, targetId: id, details: { taskId: row.id } }) } catch {}
    return respond.created(row)
  }

  const createdTask = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: priority as any,
      dueAt: dueIso ? new Date(dueIso) : null,
      assigneeId: parsed.data.assigneeId ?? null,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  })

  await prisma.requestTask.create({ data: { serviceRequestId: id, taskId: createdTask.id } })

  try { realtimeService.emitTaskUpdate(createdTask.id, { action: 'created', serviceRequestId: id }) } catch {}
  try { realtimeService.emitServiceRequestUpdate(id, { action: 'task-created', taskId: createdTask.id }) } catch {}
  try {
    const sr = await prisma.serviceRequest.findUnique({ where: { id: id }, select: { clientId: true } })
    if (sr?.clientId) {
      const ts = new Date().toISOString()
      realtimeService.broadcastToUser(String(sr.clientId), { type: 'task-updated', data: { taskId: createdTask.id, serviceRequestId: id, action: 'created' }, timestamp: ts })
      realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: id, action: 'task-created', taskId: createdTask.id }, timestamp: ts })
    }
  } catch {}

  try { await logAudit({ action: 'service-request:task:create', actorId: (session.user as any).id ?? null, targetId: id, details: { taskId: createdTask.id } }) } catch {}
  return respond.created(createdTask)
}
