import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { z } from 'zod'
import type { Prisma, RequestPriority, WorkOrderStatus } from '@prisma/client'
import { parseListQuery } from '@/schemas/list-query'

export const runtime = 'nodejs'


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
  const common = parseListQuery(searchParams, { allowedSortBy: ['createdAt','updatedAt','dueAt','priority','status'], defaultSortBy: 'createdAt', maxLimit: 100 })

  const tenantId = getTenantFromRequest(request as any)
  const take = common.limit
  const page = common.page
  const skip = common.skip
  const sortBy = common.sortBy as keyof Prisma.WorkOrderOrderByWithRelationInput
  const sortOrder = common.sortOrder

  const where: Prisma.WorkOrderWhereInput = {
    ...(isMultiTenancyEnabled() && tenantId ? (tenantFilter(tenantId) as any) : {}),
  }

  if (!canReadAll && canReadAssigned && session?.user?.id) {
    where.assigneeId = session.user.id
  }

  const q = common.q
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ]
  }

  const status = searchParams.get('status')
  if (status && status !== 'ALL') {
    where.status = status as unknown as WorkOrderStatus
  }
  const priority = searchParams.get('priority')
  if (priority && priority !== 'ALL') {
    where.priority = priority as unknown as RequestPriority
  }
  const assigneeId = searchParams.get('assigneeId')
  if (assigneeId) where.assigneeId = assigneeId
  const clientId = searchParams.get('clientId')
  if (clientId) where.clientId = clientId
  const serviceId = searchParams.get('serviceId')
  if (serviceId) where.serviceId = serviceId

  const createdFrom = searchParams.get('createdFrom')
  const createdTo = searchParams.get('createdTo')
  if (createdFrom || createdTo) {
    where.createdAt = {
      gte: createdFrom ? new Date(createdFrom) : undefined,
      lte: createdTo ? new Date(createdTo) : undefined,
    }
  }
  const dueFrom = searchParams.get('dueFrom')
  const dueTo = searchParams.get('dueTo')
  if (dueFrom || dueTo) {
    where.dueAt = {
      gte: dueFrom ? new Date(dueFrom) : undefined,
      lte: dueTo ? new Date(dueTo) : undefined,
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
