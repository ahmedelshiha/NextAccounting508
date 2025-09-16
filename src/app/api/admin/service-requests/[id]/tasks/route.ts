import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { realtimeService } from '@/lib/realtime-enhanced'

const CreateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'),
  dueAt: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const relations = await prisma.requestTask.findMany({
    where: { serviceRequestId: params.id },
    include: {
      task: {
        include: { assignee: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ success: true, data: relations.map((r) => r.task) })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_CREATE)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:task-create:${params.id}:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const createdTask = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority as any,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      assigneeId: parsed.data.assigneeId ?? null,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  })

  await prisma.requestTask.create({ data: { serviceRequestId: params.id, taskId: createdTask.id } })

  try { realtimeService.emitTaskUpdate(createdTask.id, { action: 'created', serviceRequestId: params.id }) } catch {}
  try { realtimeService.emitServiceRequestUpdate(params.id, { action: 'task-created', taskId: createdTask.id }) } catch {}
  try {
    const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
    if (sr?.clientId) {
      const ts = new Date().toISOString()
      realtimeService.broadcastToUser(String(sr.clientId), { type: 'task-updated', data: { taskId: createdTask.id, serviceRequestId: params.id, action: 'created' }, timestamp: ts })
      realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: params.id, action: 'task-created', taskId: createdTask.id }, timestamp: ts })
    }
  } catch {}

  try { await logAudit({ action: 'service-request:task:create', actorId: (session.user as any).id ?? null, targetId: params.id, details: { taskId: createdTask.id } }) } catch {}
  return NextResponse.json({ success: true, data: createdTask }, { status: 201 })
}
