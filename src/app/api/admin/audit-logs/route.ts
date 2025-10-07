import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { verifySuperAdminStepUp, stepUpChallenge } from '@/lib/security/step-up'
import { logAudit } from '@/lib/audit'

function getPagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = (ctx?.role as string | undefined)
    if (!ctx || role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    // Optional step-up MFA for sensitive super admin endpoints
    const userId = String(ctx.userId || '')
    const tenantId = ctx.tenantId
    const stepOk = await verifySuperAdminStepUp(req, userId, tenantId)
    if (!stepOk) {
      try { await logAudit({ action: 'auth.mfa.stepup.denied', actorId: userId, targetId: userId }) } catch {}
      return stepUpChallenge()
    }

    const url = new URL(req.url)
    const { page, limit, skip } = getPagination(url)
    const action = url.searchParams.get('action') || undefined
    const q = url.searchParams.get('q') || ''
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const where: any = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (q) {
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { resource: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        { userId: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, tenantId: true, userId: true, action: true, resource: true, metadata: true, ipAddress: true, userAgent: true, createdAt: true },
      }),
    ])

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load audit logs' }, { status: 500 })
  }
})
