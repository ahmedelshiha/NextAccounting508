import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { z } from 'zod'
import type { Prisma, RequestPriority, WorkOrderStatus } from '@prisma/client'

export const runtime = 'nodejs'

const ListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueAt', 'priority', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  status: z.union([z.literal('ALL'), z.nativeEnum(({} as any as { WorkOrderStatus: typeof WorkOrderStatus }).WorkOrderStatus || ({} as any))]).optional(),
  priority: z.union([z.literal('ALL'), z.nativeEnum(({} as any as { RequestPriority: typeof RequestPriority }).RequestPriority || ({} as any))]).optional(),
  assigneeId: z.string().optional(),
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
})

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  serviceRequestId: z.string().optional(),
  bookingId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
  estimatedHours: z.number().int().min(0).optional(),
  costCents: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  tags: z.array(z.string()).optional(),
  code: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined

  const canReadAll = hasPermission(role, PERMISSIONS.TASKS_READ_ALL)
  const canReadAssigned = hasPermission(role, PERMISSIONS.TASKS_READ_ASSIGNED)
  if (!session?.user || (!canReadAll && !canReadAssigned)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params', details: parsed.error.issues }, { status: 400 })
  }

  const tenantId = getTenantFromRequest(request as any)
  const take = parsed.data.limit ? Math.min(parseInt(parsed.data.limit, 10) || 20, 100) : 20
  const page = Math.max(1, parsed.data.page ? parseInt(parsed.data.page, 10) || 1 : 1)
  const skip = (page - 1) * take
  const sortBy = parsed.data.sortBy || 'createdAt'
  const sortOrder = parsed.data.sortOrder || 'desc'

  const where: Prisma.WorkOrderWhereInput = {
    ...(isMultiTenancyEnabled() && tenantId ? (tenantFilter(tenantId) as any) : {}),
  }

  if (!canReadAll && canReadAssigned && session?.user?.id) {
    where.assigneeId = session.user.id
  }

  const q = parsed.data.q?.trim()
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (parsed.data.status && parsed.data.status !== 'ALL') {
    where.status = parsed.data.status as unknown as WorkOrderStatus
  }
  if (parsed.data.priority && parsed.data.priority !== 'ALL') {
    where.priority = parsed.data.priority as unknown as RequestPriority
  }
  if (parsed.data.assigneeId) where.assigneeId = parsed.data.assigneeId
  if (parsed.data.clientId) where.clientId = parsed.data.clientId
  if (parsed.data.serviceId) where.serviceId = parsed.data.serviceId

  if (parsed.data.createdFrom || parsed.data.createdTo) {
    where.createdAt = {
      gte: parsed.data.createdFrom ? new Date(parsed.data.createdFrom) : undefined,
      lte: parsed.data.createdTo ? new Date(parsed.data.createdTo) : undefined,
    }
  }
  if (parsed.data.dueFrom || parsed.data.dueTo) {
    where.dueAt = {
      gte: parsed.data.dueFrom ? new Date(parsed.data.dueFrom) : undefined,
      lte: parsed.data.dueTo ? new Date(parsed.data.dueTo) : undefined,
    }
  }

  const orderBy: Prisma.WorkOrderOrderByWithRelationInput = { [sortBy]: sortOrder }

  const [total, rows] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({ where, orderBy, skip, take, include: {
      client: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true } },
    } }),
  ])

  return NextResponse.json({ data: rows, pagination: { page, limit: take, total, totalPages: Math.max(1, Math.ceil(total / take)) } })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_CREATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })
  }

  const {
    title,
    description,
    status,
    priority,
    clientId,
    serviceId,
    serviceRequestId,
    bookingId,
    assigneeId,
    dueAt,
    estimatedHours,
    costCents,
    currency,
    tags,
    code,
  } = parsed.data

  try {
    const data: Prisma.WorkOrderUncheckedCreateInput = {
      title,
      description: description || null,
      status: (status ? (status.toUpperCase() as any as WorkOrderStatus) : undefined) as any,
      priority: (priority ? (priority.toUpperCase() as any as RequestPriority) : undefined) as any,
      clientId: clientId || null,
      serviceId: serviceId || null,
      serviceRequestId: serviceRequestId || null,
      bookingId: bookingId || null,
      assigneeId: assigneeId || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      estimatedHours: typeof estimatedHours === 'number' ? estimatedHours : null,
      actualHours: null,
      costCents: typeof costCents === 'number' ? costCents : null,
      currency: currency || null,
      tags: tags || [],
      code: code || `WO-${Math.floor(Date.now() / 1000)}`,
    }

    const tenantId = getTenantFromRequest(request as any)
    if (isMultiTenancyEnabled() && tenantId) (data as any).tenantId = tenantId

    const created = await prisma.workOrder.create({ data })
    return NextResponse.json({ workOrder: created }, { status: 201 })
  } catch (e: any) {
    console.error('admin/work-orders POST error', e)
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
  }
}
