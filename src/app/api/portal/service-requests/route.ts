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

const CreateSchema = z.object({
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
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.any().optional(),
})

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
    ...tenantFilter(tenantId),
  }

  try {
    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, slug: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceRequest.count({ where }),
    ])

    return respond.ok(items, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (e: any) {
    // Prisma errors (no table / column) — fallback to in-memory dev store
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        const all = getAllRequests()
        const filtered = all.filter((r: any) => r.clientId === session.user.id && (!isMultiTenancyEnabled() || !tenantId || r.tenantId === tenantId))
        const total = filtered.length
        const pageItems = filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
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
      serviceId: data.serviceId,
      title: titleToUse,
      description: data.description ?? null,
      priority: data.priority as any,
      budgetMin: data.budgetMin != null ? data.budgetMin : null,
      budgetMax: data.budgetMax != null ? data.budgetMax : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      requirements: (data.requirements as any) ?? undefined,
      attachments: (data.attachments as any) ?? undefined,
      status: 'SUBMITTED',
    }
    if (isMultiTenancyEnabled() && tenantId) dataObj.tenantId = tenantId

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
          avScanTime: typeof a.avScanTime === 'number' ? a.avScanTime : undefined
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
          serviceId: data.serviceId,
          title: genTitle,
          description: data.description ?? null,
          priority: data.priority,
          budgetMin: data.budgetMin ?? null,
          budgetMax: data.budgetMax ?? null,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
          requirements: data.requirements ?? undefined,
          attachments: data.attachments ?? undefined,
          status: 'SUBMITTED',
          service: svc ? { id: svc.id, name: svc.name, slug: svc.slug, category: svc.category } : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
