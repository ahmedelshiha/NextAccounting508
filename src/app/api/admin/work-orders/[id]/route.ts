import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { z } from 'zod'
import type { Prisma, RequestPriority, WorkOrderStatus } from '@prisma/client'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

export const runtime = 'nodejs'

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  clientId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  serviceRequestId: z.string().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  startedAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  estimatedHours: z.number().int().min(0).optional().nullable(),
  actualHours: z.number().int().min(0).optional().nullable(),
  costCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  code: z.string().optional().nullable(),
})

export const GET = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined

  const canReadAll = hasPermission(role, PERMISSIONS.TASKS_READ_ALL)
  const canReadAssigned = hasPermission(role, PERMISSIONS.TASKS_READ_ASSIGNED)
  if (!ctx.userId || (!canReadAll && !canReadAssigned)) {
    return respond.unauthorized()
  }

  const { id } = await context.params
  const tenantId = ctx.tenantId

  const where: Prisma.WorkOrderWhereInput = { id }
  if (isMultiTenancyEnabled() && tenantId) Object.assign(where, tenantFilter(tenantId))
  if (!canReadAll && canReadAssigned && ctx.userId) (where as any).assigneeId = ctx.userId

  const row = await prisma.workOrder.findFirst({ where, include: {
    client: { select: { id: true, name: true, email: true } },
    assignee: { select: { id: true, name: true, email: true } },
    service: { select: { id: true, name: true } },
  } })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ workOrder: row })
})

export const PUT = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.TASKS_UPDATE)) {
    return respond.unauthorized()
  }

  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })
  }

  const tenantId = ctx.tenantId

  const where: Prisma.WorkOrderWhereUniqueInput = { id }
  if (isMultiTenancyEnabled() && tenantId) {
    const exists = await prisma.workOrder.count({ where: { id, ...(tenantFilter(tenantId) as any) } })
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: Prisma.WorkOrderUpdateInput = {}
  const v = parsed.data
  if (v.title !== undefined) data.title = v.title
  if (v.description !== undefined) data.description = v.description
  if (v.status !== undefined) data.status = (v.status.toUpperCase() as any as WorkOrderStatus)
  if (v.priority !== undefined) data.priority = (v.priority.toUpperCase() as any as RequestPriority)
  if (v.clientId !== undefined) data.client = v.clientId ? { connect: { id: v.clientId } } : { disconnect: true }
  if (v.serviceId !== undefined) data.service = v.serviceId ? { connect: { id: v.serviceId } } : { disconnect: true }
  if (v.serviceRequestId !== undefined) data.serviceRequest = v.serviceRequestId ? { connect: { id: v.serviceRequestId } } : { disconnect: true }
  if (v.bookingId !== undefined) data.booking = v.bookingId ? { connect: { id: v.bookingId } } : { disconnect: true }
  if (v.assigneeId !== undefined) data.assignee = v.assigneeId ? { connect: { id: v.assigneeId } } : { disconnect: true }
  if (v.dueAt !== undefined) data.dueAt = v.dueAt ? new Date(v.dueAt) : null
  if (v.startedAt !== undefined) data.startedAt = v.startedAt ? new Date(v.startedAt) : null
  if (v.completedAt !== undefined) data.completedAt = v.completedAt ? new Date(v.completedAt) : null
  if (v.estimatedHours !== undefined) data.estimatedHours = v.estimatedHours ?? null
  if (v.actualHours !== undefined) data.actualHours = v.actualHours ?? null
  if (v.costCents !== undefined) data.costCents = v.costCents ?? null
  if (v.currency !== undefined) data.currency = v.currency ?? null
  if (v.tags !== undefined) data.tags = v.tags
  if (v.code !== undefined) data.code = v.code ?? null

  const updated = await prisma.workOrder.update({ where, data, include: {
    client: { select: { id: true, name: true, email: true } },
    assignee: { select: { id: true, name: true, email: true } },
    service: { select: { id: true, name: true } },
  } })

  return NextResponse.json({ workOrder: updated })
})

export const DELETE = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.TASKS_DELETE)) {
    return respond.unauthorized()
  }

  const { id } = await context.params
  const tenantId = ctx.tenantId

  if (isMultiTenancyEnabled() && tenantId) {
    const exists = await prisma.workOrder.count({ where: { id, ...(tenantFilter(tenantId) as any) } })
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.workOrder.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
