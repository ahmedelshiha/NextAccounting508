import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { realtimeService } from '@/lib/realtime-enhanced'

const CreateSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    z.enum(['low', 'medium', 'high', 'urgent']).transform((v) => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
  ]).default('MEDIUM'),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.any()).optional(),
  attachments: z.any().optional(),
})

type Filters = {
  page: number
  limit: number
  status?: string | null
  priority?: string | null
  assignedTo?: string | null
  clientId?: string | null
  serviceId?: string | null
  q?: string | null
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filters: Filters = {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10))),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    assignedTo: searchParams.get('assignedTo'),
    clientId: searchParams.get('clientId'),
    serviceId: searchParams.get('serviceId'),
    q: searchParams.get('q'),
  }

  const where: any = {
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assignedTo && { assignedTeamMemberId: filters.assignedTo }),
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.serviceId && { serviceId: filters.serviceId }),
    ...(filters.q && { OR: [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
    ] }),
  }

  const [items, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, slug: true, category: true } },
        assignedTeamMember: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.serviceRequest.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_CREATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const created = await prisma.serviceRequest.create({
    data: {
      clientId: data.clientId,
      serviceId: data.serviceId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority as any,
      budgetMin: data.budgetMin != null ? data.budgetMin : null,
      budgetMax: data.budgetMax != null ? data.budgetMax : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      requirements: data.requirements ?? undefined,
      attachments: data.attachments ?? undefined,
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, slug: true, category: true } },
    },
  })

  // Auto-assign to a team member based on skills and workload
  try {
    const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
    await autoAssignServiceRequest(created.id)
  } catch {
    // best-effort; ignore assignment failures
  }

  try { realtimeService.emitServiceRequestUpdate(created.id, { action: 'created' }) } catch {}

  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
