import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { realtimeService } from '@/lib/realtime-enhanced'
import { respond, zodDetails } from '@/lib/api-response'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'

const CreateSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300).optional(),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    z.enum(['low', 'medium', 'high', 'urgent']).transform((v) => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
  ]).default('MEDIUM'),
  budgetMin: z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (typeof v === 'string') return Number(v)
    return v
  }, z.number().optional()),
  budgetMax: z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (typeof v === 'string') return Number(v)
    return v
  }, z.number().optional()),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
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
  dateFrom?: string | null
  dateTo?: string | null
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') || '').toLowerCase()
  const filters: Filters = {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10))),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    assignedTo: searchParams.get('assignedTo'),
    clientId: searchParams.get('clientId'),
    serviceId: searchParams.get('serviceId'),
    q: searchParams.get('q'),
    dateFrom: searchParams.get('dateFrom'),
    dateTo: searchParams.get('dateTo'),
  }

  const tenantId = getTenantFromRequest(request as any)
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
    // Prefer new booking fields when available (Phase 1)
    ...(type === 'appointments' ? { isBooking: true } : {}),
    ...(type === 'requests' ? { OR: [{ isBooking: false }, { isBooking: null }] } : {}),
    ...(filters.dateFrom || filters.dateTo ? (
      type === 'appointments'
        ? {
            scheduledAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
            },
          }
        : {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
            },
          }
    ) : {}),
    ...tenantFilter(tenantId),
  }

  try {
    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, name: true, slug: true, category: true } },
          assignedTeamMember: { select: { id: true, name: true, email: true } },
        },
        orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.serviceRequest.count({ where }),
    ])

    return respond.ok(items, {
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    })
  } catch (e: any) {
    const code = String((e as any)?.code || '')
    const msg = String(e?.message || '')

    // Fallback when DB hasn't applied Phase 1 columns yet (scheduledAt/isBooking)
    if (code === 'P2022' || /column .*does not exist/i.test(msg)) {
      const whereLegacy: any = {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assignedTo && { assignedTeamMemberId: filters.assignedTo }),
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.serviceId && { serviceId: filters.serviceId }),
        ...(filters.q && { OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
        ] }),
        ...(type === 'appointments' ? { deadline: { not: null } } : {}),
        ...(type === 'requests' ? { deadline: null } : {}),
        ...(filters.dateFrom || filters.dateTo ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
          }
        } : {}),
        ...tenantFilter(tenantId),
      }

      const [items, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereLegacy,
          include: {
            client: { select: { id: true, name: true, email: true } },
            service: { select: { id: true, name: true, slug: true, category: true } },
            assignedTeamMember: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (filters.page - 1) * filters.limit,
          take: filters.limit,
        }),
        prisma.serviceRequest.count({ where: whereLegacy }),
      ])

      return respond.ok(items, {
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      })
    }

    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        let all: any[] = getAllRequests() as any[]
        if (isMultiTenancyEnabled() && tenantId) {
          all = all.filter((r: any) => String(r.tenantId || '') === String(tenantId))
        }
        // Optional type filter for early UI support: appointments vs requests (fallback only)
        if (type === 'appointments') {
          all = all.filter((r: any) => !!((r as any).scheduledAt || r.deadline))
        } else if (type === 'requests') {
          all = all.filter((r: any) => !((r as any).scheduledAt || r.deadline))
        }
        if (filters.status) all = all.filter((r: any) => String(r.status) === String(filters.status))
        if (filters.priority) all = all.filter((r: any) => String(r.priority) === String(filters.priority))
        if (filters.assignedTo) all = all.filter((r: any) => String((r as any).assignedTeamMemberId || '') === String(filters.assignedTo))
        if (filters.clientId) all = all.filter((r: any) => String(r.clientId) === String(filters.clientId))
        if (filters.serviceId) all = all.filter((r: any) => String(r.serviceId) === String(filters.serviceId))
        if (filters.q) {
          const q = String(filters.q).toLowerCase()
          all = all.filter((r: any) =>
            String(r.title || '').toLowerCase().includes(q) ||
            String(r.description || '').toLowerCase().includes(q)
          )
        }
        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom).getTime()
          all = all.filter((r: any) => {
            const t = new Date(r.deadline || r.createdAt || 0).getTime()
            return t >= from
          })
        }
        if (filters.dateTo) {
          const to = new Date(new Date(filters.dateTo).setHours(23,59,59,999)).getTime()
          all = all.filter((r: any) => {
            const t = new Date(r.deadline || r.createdAt || 0).getTime()
            return t <= to
          })
        }
        all.sort((a: any, b: any) => {
          const ad = new Date(a.createdAt || 0).getTime()
          const bd = new Date(b.createdAt || 0).getTime()
          return bd - ad
        })
        const total = all.length
        const start = (filters.page - 1) * filters.limit
        const end = start + filters.limit
        const pageItems = all.slice(start, end)
        return respond.ok(pageItems, {
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
          },
        })
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_CREATE)) {
    return respond.unauthorized()
  }

  const tenantId = getTenantFromRequest(request as any)
  const ip = getClientIp(request)
  if (!rateLimit(`service-requests:create:${ip}`, 10, 60_000)) {
    return respond.tooMany()
  }
  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const data = parsed.data
  // Generate title if missing
  let titleToUse = data.title
  if (!titleToUse) {
    try {
      const svc = await prisma.service.findUnique({ where: { id: data.serviceId } })
      const client = await prisma.user.findUnique({ where: { id: data.clientId } })
      const clientName = client?.name || data.clientId
      const svcName = svc?.name || data.serviceId
      titleToUse = `${svcName} request — ${clientName} — ${new Date().toISOString().slice(0,10)}`
    } catch {
      titleToUse = `${data.serviceId} request — ${data.clientId} — ${new Date().toISOString().slice(0,10)}`
    }
  }

  try {
    // Validate foreign keys explicitly to return clear errors instead of 500
    const [clientExists, serviceExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.clientId }, select: { id: true } }),
      prisma.service.findUnique({ where: { id: data.serviceId }, select: { id: true } }),
    ])
    if (!clientExists) return respond.badRequest('Invalid clientId')
    if (!serviceExists) return respond.badRequest('Invalid serviceId')

    const created = await prisma.serviceRequest.create({
      data: {
        clientId: data.clientId,
        serviceId: data.serviceId,
        title: titleToUse,
        description: data.description ?? null,
        priority: data.priority as any,
        budgetMin: data.budgetMin != null ? data.budgetMin : null,
        budgetMax: data.budgetMax != null ? data.budgetMax : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        requirements: (data.requirements as any) ?? undefined,
        attachments: (data.attachments as any) ?? undefined,
        ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {}),
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
    } catch {}

    try { realtimeService.emitServiceRequestUpdate(created.id, { action: 'created' }) } catch {}
    try { realtimeService.broadcastToUser(String(created.clientId), { type: 'service-request-updated', data: { serviceRequestId: created.id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}
    try { await logAudit({ action: 'service-request:create', actorId: (session.user as any).id ?? null, targetId: created.id, details: { clientId: created.clientId, serviceId: created.serviceId, priority: created.priority, serviceSnapshot: (created.requirements as any)?.serviceSnapshot ?? null } }) } catch {}

    return respond.created(created)
  } catch (e: any) {
    const msg = String(e?.message || '')
    const code = String((e as any)?.code || '')
    if (code === 'P2003') {
      return respond.badRequest('Invalid clientId or serviceId')
    }
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      try {
        const { addRequest } = await import('@/lib/dev-fallbacks')
        const id = `dev-${Date.now().toString()}`
        const created: any = {
          id,
          clientId: data.clientId,
          serviceId: data.serviceId,
          title: titleToUse || `${data.serviceId} request — ${data.clientId} — ${new Date().toISOString().slice(0,10)}`,
          description: data.description ?? null,
          priority: data.priority,
          budgetMin: data.budgetMin ?? null,
          budgetMax: data.budgetMax ?? null,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
          requirements: data.requirements ?? undefined,
          attachments: data.attachments ?? undefined,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        if (isMultiTenancyEnabled() && tenantId) (created as any).tenantId = tenantId
        addRequest(id, created)
        try { realtimeService.emitServiceRequestUpdate(id, { action: 'created' }) } catch {}
        try { await logAudit({ action: 'service-request:create', actorId: (session.user as any).id ?? null, targetId: id, details: { clientId: created.clientId, serviceId: created.serviceId, priority: created.priority } }) } catch {}
        return respond.created(created)
      } catch {
        return respond.serverError()
      }
    }
    return respond.serverError('Failed to create service request', { code, message: msg })
  }
}
