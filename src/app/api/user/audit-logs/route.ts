import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { NextResponse } from 'next/server'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // Rate limit: 60/min per IP for listing
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:audit-logs:get:${ip}`, 60, 60_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })

    // Parse pagination parameters
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')))
    const skip = (page - 1) * pageSize

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: String(ctx.userId || '') },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, action: true, resource: true, metadata: true, ipAddress: true, userAgent: true, createdAt: true },
      }),
      prisma.auditLog.count({
        where: { userId: String(ctx.userId || '') },
      }),
    ])

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 })
  }
})
