import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { planRecurringBookings } from '@/lib/booking/recurring'
import { realtimeService } from '@/lib/realtime-enhanced'

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
  recurringPattern: z.object({
    frequency: z.enum(['DAILY','WEEKLY','MONTHLY']),
    interval: z.number().int().positive().optional(),
    count: z.number().int().positive().optional(),
    until: z.string().datetime().optional(),
    byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
  }).optional(),
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
  const idemKey = request.headers.get('x-idempotency-key') || ''
  if (idemKey) {
    try {
      const { findIdempotentResult, reserveIdempotencyKey } = await import('@/lib/idempotency')
      const existing = await findIdempotentResult(idemKey)
      if (existing && existing.entityId && existing.entityType === 'ServiceRequest') {
        try {
          const existingEntity = await prisma.serviceRequest.findUnique({ where: { id: existing.entityId }, include: { service: { select: { id: true, name: true, slug: true, category: true } } } })
          if (existingEntity) return respond.created(existingEntity)
        } catch {}
      }
      await reserveIdempotencyKey(idemKey, (session.user as any)?.id || null, (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null)
    } catch {}
  }
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
    if (!svc || String((svc as any).status).toUpperCase() !== 'ACTIVE') {
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
        recurringPattern: (data as any).recurringPattern ?? undefined,
      } : {}),
    }
    // Elevate priority for emergency bookings
    if (String((data as any).bookingType || '').toUpperCase() === 'EMERGENCY') {
      dataObj.priority = 'URGENT'
    }
    if (isMultiTenancyEnabled() && tenantId) dataObj.tenantId = tenantId

    // For booking-type requests, enforce minAdvance and conflict detection prior to creation
    if ((data as any).isBooking) {
      try {
        const bookingType = String((data as any).bookingType || '').toUpperCase()
        const svcRec = await prisma.service.findUnique({ where: { id: (data as any).serviceId } })
        const minAdvanceHours = typeof svcRec?.minAdvanceHours === 'number' ? svcRec!.minAdvanceHours : 0
        if (bookingType !== 'EMERGENCY' && minAdvanceHours > 0) {
          const now = new Date()
          const scheduled = new Date((data as any).scheduledAt)
          const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (diffHours < minAdvanceHours) return respond.badRequest('Selected time is too soon for this service. Please respect min advance booking rules.')
        }

        const { checkBookingConflict } = await import('@/lib/booking/conflict-detection')
        const svcDuration = (svcRec?.duration) ?? 60
        const check = await checkBookingConflict({
          serviceId: (data as any).serviceId,
          start: new Date((data as any).scheduledAt),
          durationMinutes: Number((data as any).duration ?? svcDuration),
          excludeBookingId: undefined,
          tenantId: (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null,
          teamMemberId: null,
        })
        if (check.conflict) return respond.conflict('Scheduling conflict detected', { reason: check.details?.reason, conflictingBookingId: check.details?.conflictingBookingId })

        // Extra validation for emergency bookings
        if (bookingType === 'EMERGENCY') {
          try {
            const req: any = (data as any).requirements || {}
            const emReason = (req.booking && req.booking.emergencyReason) || req.emergencyReason
            const phone = (req.booking && req.booking.clientPhone) || null
            if (!emReason || String(emReason).trim().length < 10) {
              return respond.badRequest('Emergency details are required (min 10 characters).')
            }
            if (!phone || String(phone).trim().length < 5) {
              return respond.badRequest('Phone number is required for emergency bookings.')
            }
          } catch {}
        }
      } catch {}
    }

    // Recurring series creation for portal clients
    if ((data as any).isBooking && String((data as any).bookingType) === 'RECURRING' && (data as any).recurringPattern) {
      const svcDuration = svc?.duration ?? 60
      const durationMinutes = Number((data as any).duration ?? svcDuration)
      const rp: any = (data as any).recurringPattern
      const normalized = {
        frequency: String(rp.frequency) as 'DAILY'|'WEEKLY'|'MONTHLY',
        interval: rp.interval ? Number(rp.interval) : undefined,
        count: rp.count ? Number(rp.count) : undefined,
        until: rp.until ? new Date(rp.until) : undefined,
        byWeekday: Array.isArray(rp.byWeekday) ? rp.byWeekday.map((n: any) => Number(n)) : undefined,
      }

      const plan = await planRecurringBookings({
        serviceId: (data as any).serviceId,
        clientId: session.user.id,
        durationMinutes,
        start: new Date((data as any).scheduledAt),
        pattern: normalized as any,
        tenantId: (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null,
        teamMemberId: null,
      })

      const parent = await prisma.serviceRequest.create({
        data: {
          ...dataObj,
          isBooking: true,
          duration: durationMinutes,
          bookingType: 'RECURRING' as any,
          recurringPattern: normalized as any,
        },
        include: { service: { select: { id: true, name: true, slug: true, category: true } } },
      })

      const childrenCreated: any[] = []
      const skipped: any[] = []
      for (const item of plan.plan) {
        if (item.conflict) { skipped.push(item); continue }
        const child = await prisma.serviceRequest.create({
          data: {
            clientId: session.user.id,
            serviceId: (data as any).serviceId,
            title: `${titleToUse} — ${item.start.toISOString().slice(0,10)}`,
            description: (data as any).description ?? null,
            priority: (data as any).priority as any,
            budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
            budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
            requirements: ((data as any).requirements as any) ?? undefined,
            attachments: ((data as any).attachments as any) ?? undefined,
            status: 'SUBMITTED',
            isBooking: true,
            scheduledAt: item.start,
            duration: durationMinutes,
            bookingType: 'RECURRING' as any,
            parentBookingId: parent.id,
            ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {}),
          },
          include: { service: { select: { id: true, name: true, slug: true, category: true } } },
        })
        childrenCreated.push(child)
      }

      try { realtimeService.broadcastToUser(String(session.user.id), { type: 'service-request-updated', data: { serviceRequestId: parent.id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}
      try {
        const dates = new Set<string>()
        try { dates.add(new Date((parent as any).scheduledAt).toISOString().slice(0,10)) } catch {}
        for (const item of plan.plan) {
          if (!item.conflict && item.start) {
            try { dates.add(new Date(item.start).toISOString().slice(0,10)) } catch {}
          }
        }
        for (const d of Array.from(dates)) {
          try { realtimeService.emitAvailabilityUpdate(parent.serviceId, { date: d }) } catch {}
        }
      } catch {}
      return respond.created({ parent, childrenCreated, skipped })
    }

    const created = await prisma.serviceRequest.create({
      data: dataObj,
      include: {
        service: { select: { id: true, name: true, slug: true, category: true } },
      },
    })

    try { if (typeof idemKey === 'string' && idemKey) { const { finalizeIdempotencyKey } = await import('@/lib/idempotency'); await finalizeIdempotencyKey(idemKey, 'ServiceRequest', created.id) } } catch {}
    try { realtimeService.broadcastToUser(String(session.user.id), { type: 'service-request-updated', data: { serviceRequestId: created.id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}

    // Auto-assign if team autoAssign is enabled (prefer team-based autoAssign flag)
    try {
      const autoCount = await prisma.teamMember.count({ where: { autoAssign: true, isAvailable: true } }).catch(() => 0)
      if (autoCount > 0) {
        try {
          const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
          await autoAssignServiceRequest(created.id).catch(() => null)
        } catch {}
      }
    } catch {}

    try {
      if ((created as any)?.isBooking && (created as any)?.scheduledAt) {
        const d = new Date((created as any).scheduledAt).toISOString().slice(0,10)
        try { realtimeService.emitAvailabilityUpdate(created.serviceId, { date: d }) } catch {}
      }
    } catch {}

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
        try { realtimeService.broadcastToUser(String(session.user.id), { type: 'service-request-updated', data: { serviceRequestId: id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}
        try {
          if ((created as any)?.isBooking && (created as any)?.scheduledAt) {
            const d = new Date((created as any).scheduledAt).toISOString().slice(0,10)
            try { realtimeService.emitAvailabilityUpdate((created as any).serviceId, { date: d }) } catch {}
          }
        } catch {}
        return respond.created(created)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}
