import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'

const CreateSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW','MEDIUM','HIGH','URGENT']),
    z.enum(['low','medium','high','urgent']).transform(v => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
  ]).default('MEDIUM'),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
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
        const { devServiceRequests } = await import('@/lib/dev-fallbacks')
        const all = Array.from(devServiceRequests.values())
        const filtered = all.filter((r: any) => r.clientId === session.user.id)
        const total = filtered.length
        const pageItems = filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
        return respond.ok(pageItems, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
      } catch {
        return respond.internal()
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
    // Prisma issues — fall back to file/seeded services list
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const res = await fetch('http://localhost:3000/api/services')
        const json = await res.json().catch(() => null)
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        svc = list.find((s: any) => s.id === data.serviceId) || null
        if (!svc) return respond.badRequest('Service not found or inactive')
      } catch {
        return respond.internal()
      }
    } else {
      throw e
    }
  }

  try {
    const created = await prisma.serviceRequest.create({
      data: {
        clientId: session.user.id,
        serviceId: data.serviceId,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority as any,
        budgetMin: data.budgetMin != null ? data.budgetMin : null,
        budgetMax: data.budgetMax != null ? data.budgetMax : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        requirements: (data.requirements as any) ?? undefined,
        attachments: (data.attachments as any) ?? undefined,
        status: 'SUBMITTED',
      },
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
          avStatus: a.uploadError ? 'error' : undefined,
        }))
        // Bulk create, ignoring duplicates via try/catch per item
        for (const item of toCreate) {
          try { await prismaClient.attachment.create({ data: item }) } catch {}
        }
      }
    } catch (e) {
      try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:create:attachments' }) } catch {}
    }

    return respond.created(created)
  } catch (e: any) {
    if (String(e?.code || '').startsWith('P20')) {
      // Fallback: store in-memory for dev
      try {
        const { devServiceRequests } = await import('@/lib/dev-fallbacks')
        const id = `dev-${Date.now().toString()}`
        const created: any = {
          id,
          clientId: session.user.id,
          serviceId: data.serviceId,
          title: data.title,
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
        devServiceRequests.set(id, created)
        return respond.created(created)
      } catch {
        return respond.internal()
      }
    }
    throw e
  }
}
