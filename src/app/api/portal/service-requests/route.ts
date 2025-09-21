import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const CreateBase = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300).optional(),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW','MEDIUM','HIGH','URGENT']),
    z.enum(['low','medium','high','urgent']).transform(v => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
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
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.any().optional(),
})

const CreateRequestSchema = CreateBase.extend({
  isBooking: z.literal(false).optional(),
  deadline: z.string().datetime().optional(),
})

const CreateBookingSchema = CreateBase.extend({
  isBooking: z.literal(true),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  bookingType: z.enum(['STANDARD','RECURRING','EMERGENCY','CONSULTATION']).optional(),
})

const CreateSchema = z.union([CreateRequestSchema, CreateBookingSchema])

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return respond.unauthorized()
  }
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type')
  const bookingType = searchParams.get('bookingType')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const tenantId = getTenantFromRequest(request as any)
  const where: any = {
    clientId: session.user.id,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(type === 'appointments' ? { isBooking: true } : {}),
    ...(bookingType ? { bookingType } : {}),
    ...(dateFrom || dateTo ? (
      type === 'appointments'
        ? { scheduledAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          } }
        : { createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          } }
    ) : {}),
    ...tenantFilter(tenantId),
  }

  try {
    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, slug: true, category: true } },
        },
        orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceRequest.count({ where }),
    ])

    return respond.ok(items, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (e: any) {
    const code = String(e?.code || '')
    const msg = String(e?.message || '')

    // Legacy path when scheduledAt/isBooking columns are missing
    if (code === 'P2022' || /column .*does not exist/i.test(msg)) {
      const whereLegacy: any = {
        clientId: session.user.id,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }),
        ...(type === 'appointments' ? { deadline: { not: null } } : {}),
        ...(type === 'requests' ? { deadline: null } : {}),
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          },
        } : {}),
        ...tenantFilter(tenantId),
      }
      const [items, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereLegacy,
          include: { service: { select: { id: true, name: true, slug: true, category: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.serviceRequest.count({ where: whereLegacy }),
      ])
      return respond.ok(items, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    // Prisma errors (no table / database not configured) — fallback to in-memory dev store
    if (code.startsWith('P20')) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        let all = getAllRequests()
        all = all.filter((r: any) => r.clientId === session.user.id && (!isMultiTenancyEnabled() || !tenantId || r.tenantId === tenantId))
        if (type === 'appointments') all = all.filter((r: any) => !!((r as any).scheduledAt || r.deadline))
        if (type === 'requests') all = all.filter((r: any) => !((r as any).scheduledAt || r.deadline))
        if (status) all = all.filter((r: any) => String(r.status) === String(status))
        if (priority) all = all.filter((r: any) => String(r.priority) === String(priority))
        if (bookingType) all = all.filter((r: any) => String((r as any).bookingType || '') === String(bookingType))
        if (q) {
          const qq = String(q).toLowerCase()
          all = all.filter((r: any) => String(r.title || '').toLowerCase().includes(qq) || String(r.description || '').toLowerCase().includes(qq))
        }
        if (dateFrom) {
          const from = new Date(dateFrom).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.deadline || r.createdAt || 0).getTime() >= from)
        }
        if (dateTo) {
          const to = new Date(new Date(dateTo).setHours(23,59,59,999)).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.deadline || r.createdAt || 0).getTime() <= to)
        }
        all.sort((a: any, b: any) => {
          const ad = new Date((a as any).scheduledAt || a.createdAt || 0).getTime()
          const bd = new Date((b as any).scheduledAt || b.createdAt || 0).getTime()
          return bd - ad
        })
        const total = all.length
        const pageItems = all.slice((page - 1) * limit, (page - 1) * limit + limit)
        return respond.ok(pageItems, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return respond.unauthorized()
  }

  const tenantId = getTenantFromRequest(request as any)
  const ip = getClientIp(request)
  if (!rateLimit(`portal:service-requests:create:${ip}`, 5, 60_000)) {
    return respond.tooMany()
  }
  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const data = parsed.data

  // Validate service exists and active
  // Validate service exists and active
  let svc: any = null
  try {
    svc = await prisma.service.findUnique({ where: { id: data.serviceId } })
    if (!svc || (svc as any).active === false) {
      return respond.badRequest('Service not found or inactive')
    }
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:service-requests:POST:service-lookup' }) } catch {}
    // Prisma issues — fall back to internal services route (no network assumptions)
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const mod = await import('@/app/api/services/route')
        const resp: any = await mod.GET(new Request('https://internal/api/services') as any)
        const json = await resp.json().catch(() => null)
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        svc = list.find((s: any) => s.id === data.serviceId) || null
        if (!svc) return respond.badRequest('Service not found or inactive')
      } catch {
        return respond.serverError()
      }
    } else {
      throw e
    }
  }

  try {
    // If title not provided, generate a friendly title using service name + client
    let titleToUse = data.title
    if (!titleToUse) {
      try {
        const clientName = (session.user as any)?.name || session.user.id
        titleToUse = `${svc.name} request — ${clientName} — ${new Date().toISOString().slice(0,10)}`
      } catch {
        titleToUse = `${svc.name} request — ${session.user.id} — ${new Date().toISOString().slice(0,10)}`
      }
    }

    const dataObj: any = {
      clientId: session.user.id,
      serviceId: (data as any).serviceId,
      title: titleToUse,
      description: (data as any).description ?? null,
      priority: (data as any).priority as any,
      budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
      budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
      deadline: (data as any).deadline ? new Date((data as any).deadline) : null,
      requirements: ((data as any).requirements as any) ?? undefined,
      attachments: ((data as any).attachments as any) ?? undefined,
      status: 'SUBMITTED',
      ...('isBooking' in data && (data as any).isBooking ? {
        isBooking: true,
        scheduledAt: new Date((data as any).scheduledAt),
        duration: (data as any).duration ?? null,
        bookingType: (data as any).bookingType ?? null,
      } : {}),
    }
    if (isMultiTenancyEnabled() && tenantId) dataObj.tenantId = tenantId

    // For booking-type requests, enforce conflict detection prior to creation
    if ((data as any).isBooking) {
      try {
        const { checkBookingConflict } = await import('@/lib/booking/conflict-detection')
        const svcDuration = (await prisma.service.findUnique({ where: { id: (data as any).serviceId } }))?.duration ?? 60
        const check = await checkBookingConflict({
          serviceId: (data as any).serviceId,
          start: new Date((data as any).scheduledAt),
          durationMinutes: Number((data as any).duration ?? svcDuration),
          excludeBookingId: undefined,
          tenantId: (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null,
          teamMemberId: null,
        })
        if (check.conflict) return respond.conflict('Scheduling conflict detected', { reason: check.details?.reason, conflictingBookingId: check.details?.conflictingBookingId })
      } catch {}
    }

    const created = await prisma.serviceRequest.create({
      data: dataObj,
      include: {
        service: { select: { id: true, name: true, slug: true, category: true } },
      },
    })

    // Persist attachments as Attachment records if provided
    try {
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        const { default: prismaClient } = await import('@/lib/prisma')
        const toCreate = data.attachments.map((a: any) => ({
          key: a.key || undefined,
          url: a.url || undefined,
          name: a.name || undefined,
          size: typeof a.size === 'number' ? a.size : undefined,
          contentType: a.type || undefined,
          provider: process.env.UPLOADS_PROVIDER || undefined,
          serviceRequestId: created.id,
          avStatus: a.uploadError ? 'error' : (a.avStatus || undefined),
          avDetails: a.avDetails || undefined,
          avScanAt: a.avScanAt ? new Date(a.avScanAt) : undefined,
          avThreatName: a.avThreatName || undefined,
          avScanTime: typeof a.avScanTime === 'number' ? a.avScanTime : undefined,
          ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {})
        }))
        // Bulk create, ignoring duplicates via try/catch per item
        for (const item of toCreate) {
          try { await prismaClient.attachment.create({ data: item }) } catch {}
        }
      }
    } catch (e) {
      try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:create:attachments' }) } catch {}
    }

    try { await logAudit({ action: 'service-request:create', actorId: session.user.id ?? null, targetId: created.id, details: { clientId: created.clientId, serviceId: created.serviceId, priority: created.priority, serviceSnapshot: (created.requirements as any)?.serviceSnapshot ?? null } }) } catch {}
    return respond.created(created)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:service-requests:POST:create' }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      // Fallback: store in-memory for dev
      try {
        const { addRequest } = await import('@/lib/dev-fallbacks')
        const id = `dev-${Date.now().toString()}`
        const genTitle = data.title || `${svc?.name || data.serviceId} request — ${session.user?.name || session.user.id} — ${new Date().toISOString().slice(0,10)}`
        const created: any = {
          id,
          clientId: session.user.id,
          serviceId: (data as any).serviceId,
          title: genTitle,
          description: (data as any).description ?? null,
          priority: (data as any).priority,
          budgetMin: (data as any).budgetMin ?? null,
          budgetMax: (data as any).budgetMax ?? null,
          deadline: (data as any).deadline ? new Date((data as any).deadline).toISOString() : null,
          requirements: (data as any).requirements ?? undefined,
          attachments: (data as any).attachments ?? undefined,
          status: 'SUBMITTED',
          service: svc ? { id: svc.id, name: svc.name, slug: svc.slug, category: svc.category } : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        if ('isBooking' in (data as any) && (data as any).isBooking) {
          created.isBooking = true
          created.scheduledAt = new Date((data as any).scheduledAt).toISOString()
          created.duration = (data as any).duration ?? null
          created.bookingType = (data as any).bookingType ?? null
        }
        if (isMultiTenancyEnabled() && tenantId) (created as any).tenantId = tenantId
        addRequest(id, created)
        return respond.created(created)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}
