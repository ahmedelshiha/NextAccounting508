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
    if (!hasDb) return NextResponse.json({ data: [] })

    const rows = await prisma.auditLog.findMany({
      where: { userId: String(ctx.userId || '') },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, action: true, resource: true, metadata: true, ipAddress: true, userAgent: true, createdAt: true },
    })

    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 })
  }
})
