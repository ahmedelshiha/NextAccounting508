export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { respond, zodDetails } from '@/lib/api-response'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'

const GuestCreateSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  // Stricter guest limits: 3 requests / minute per IP
  if (!rateLimit(`public:sr:create:${ip}`, 3, 60_000)) {
    return respond.tooMany()
  }

  const tenantId = getTenantFromRequest(request as any)
  const body = await request.json().catch(() => null)
  const parsed = GuestCreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }
  const data = parsed.data

  try {
    // Validate service exists and is active
    const service = await prisma.service.findUnique({ where: { id: data.serviceId }, select: { id: true, name: true, active: true } })
    if (!service || service.active === false) {
      return respond.badRequest('Service not found or inactive')
    }

    // Find or create user by email as CLIENT
    let user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      user = await prisma.user.create({ data: { email: data.email, name: data.name, role: 'CLIENT' as any } })
    }

    // Generate title if missing
    const titleToUse = data.title || `${service.name} request — ${data.name} — ${new Date().toISOString().slice(0,10)}`

    const createData: any = {
      clientId: user.id,
      serviceId: data.serviceId,
      title: titleToUse,
      description: data.description ?? null,
      priority: data.priority as any,
      budgetMin: data.budgetMin != null ? data.budgetMin : null,
      budgetMax: data.budgetMax != null ? data.budgetMax : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      requirements: (data.requirements as any) ?? undefined,
      attachments: (data.attachments as any) ?? undefined,
      status: 'SUBMITTED' as any,
    }
    if (isMultiTenancyEnabled() && tenantId) createData.tenantId = tenantId

    const created = await prisma.serviceRequest.create({
      data: createData,
      include: { service: { select: { id: true, name: true, slug: true, category: true } } },
    })

    // Auto-assign using existing logic (best-effort)
    try {
      const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
      await autoAssignServiceRequest(created.id)
    } catch {}

    try { await logAudit({ action: 'service-request:create:guest', actorId: user.id, targetId: created.id, details: { email: user.email, serviceId: created.serviceId } }) } catch {}

    // Return created SR
    return respond.created(created)
  } catch (e: any) {
    const code = String((e as any)?.code || '')
    const msg = String(e?.message || '')
    if (code.startsWith('P10') || code.startsWith('P20') || /Database is not configured/i.test(msg)) {
      // Fallback to in-memory store
      try {
        const { addRequest } = await import('@/lib/dev-fallbacks')
        const id = `dev-${Date.now().toString()}`
        const created: any = {
          id,
          clientId: `guest:${data.email}`,
          serviceId: data.serviceId,
          title: data.title || `${data.serviceId} request — ${data.name} — ${new Date().toISOString().slice(0,10)}`,
          description: data.description ?? null,
          priority: data.priority,
          budgetMin: data.budgetMin ?? null,
          budgetMax: data.budgetMax ?? null,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
          requirements: data.requirements ?? undefined,
          attachments: data.attachments ?? undefined,
          status: 'SUBMITTED',
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
    return respond.serverError('Failed to create service request', { code, message: msg })
  }
}
