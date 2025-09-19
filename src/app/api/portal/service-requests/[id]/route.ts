import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond } from '@/lib/api-response'
import { NextRequest } from 'next/server'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return respond.unauthorized()
  }

  const tenantId = getTenantFromRequest(req as any)
  try {
    const item = await prisma.serviceRequest.findUnique({
      where: { id: id },
      include: {
        service: { select: { id: true, name: true, slug: true, category: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (!item || item.clientId !== session.user.id) {
      return respond.notFound('Service request not found')
    }
    if (isMultiTenancyEnabled() && tenantId && (item as any).tenantId && (item as any).tenantId !== tenantId) {
      return respond.notFound('Service request not found')
    }

    return respond.ok(item)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:service-requests:[id]:GET' }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getRequest, getComments } = await import('@/lib/dev-fallbacks')
        const item = getRequest(id)
        if (!item || item.clientId !== session.user.id) return respond.notFound('Service request not found')
        const comments = getComments(id) || []
        return respond.ok({ ...item, comments })
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return respond.unauthorized()
  }

  // Allow client to perform limited updates like adding description or cancelling (if allowed)
  const ip = getClientIp(req)
  if (!rateLimit(`portal:service-requests:update:${ip}`, 10, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => ({} as any))
  const allowed: any = {}
  if (typeof body.description === 'string') allowed.description = body.description
  if (body.action === 'cancel') allowed.status = 'CANCELLED'

  try {
    const existing = await prisma.serviceRequest.findUnique({ where: { id: id }, select: { clientId: true, status: true } })
    if (!existing || existing.clientId !== session.user.id) {
      return respond.notFound('Service request not found')
    }
    if (body.action === 'approve') {
      if (['CANCELLED','COMPLETED'].includes(existing.status as any)) {
        return respond.badRequest('Cannot approve at current status')
      }
      if (!['SUBMITTED','IN_REVIEW','APPROVED'].includes(existing.status as any)) {
        return respond.badRequest('Approval not applicable')
      }
      allowed.clientApprovalAt = new Date()
      allowed.status = 'APPROVED'
    }
    if (allowed.status === 'CANCELLED' && ['IN_PROGRESS','COMPLETED','CANCELLED'].includes(existing.status as any)) {
      return respond.badRequest('Cannot cancel at current status')
    }

    const updated = await prisma.serviceRequest.update({ where: { id: id }, data: allowed })
    try {
      const { realtimeService } = await import('@/lib/realtime-enhanced')
      realtimeService.emitServiceRequestUpdate(id)
    } catch {}
    return respond.ok(updated)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { route: 'portal:service-requests:[id]:PATCH' }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getRequest, updateRequest } = await import('@/lib/dev-fallbacks')
        const existing = getRequest(id)
        if (!existing || existing.clientId !== session.user.id) return respond.notFound('Service request not found')
        if (body.action === 'approve') {
          if (['CANCELLED','COMPLETED'].includes(existing.status as any)) {
            return respond.badRequest('Cannot approve at current status')
          }
          if (!['SUBMITTED','IN_REVIEW','APPROVED'].includes(existing.status as any)) {
            return respond.badRequest('Approval not applicable')
          }
          allowed.clientApprovalAt = new Date().toISOString()
          allowed.status = 'APPROVED'
        }
        if (allowed.status === 'CANCELLED' && ['IN_PROGRESS','COMPLETED','CANCELLED'].includes(existing.status as any)) {
          return respond.badRequest('Cannot cancel at current status')
        }
        const updated = updateRequest(id, allowed)
        try {
          const { realtimeService } = await import('@/lib/realtime-enhanced')
          realtimeService.emitServiceRequestUpdate(id)
        } catch {}
        return respond.ok(updated)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
}
