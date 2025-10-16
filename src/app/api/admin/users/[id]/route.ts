import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { tenantFilter } from '@/lib/tenant'
import { realtimeService } from '@/lib/realtime-enhanced'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

export const runtime = 'nodejs'

export const PATCH = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? ''
    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const { id } = await context.params

    const tenantId = ctx.tenantId
    const existing = await prisma.user.findFirst({ where: { id, ...(tenantFilter(tenantId) as any) }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ip = getClientIp(request as unknown as Request)
    {
      const key = `role:${ip}`
      const rl = await applyRateLimit(key, 20, 60_000)
      if (!rl.allowed) {
        try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(request.url).pathname } }) } catch {}
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    const json = await request.json().catch(() => ({}))
    const { userUpdateSchema } = await import('@/lib/validation')
    const parsed = userUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const data: { name?: string; email?: string; role?: import('@prisma/client').UserRole } = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.email !== undefined) data.email = parsed.data.email
    if (parsed.data.role !== undefined) data.role = parsed.data.role as import('@prisma/client').UserRole

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    if (parsed.data.role !== undefined) {
      await logAudit({
        action: 'user.role.update',
        actorId: ctx.userId,
        targetId: id,
        details: { to: parsed.data.role }
      })
      try {
        realtimeService.broadcastToUser(String(id), {
          type: 'user-role-updated',
          data: { userId: String(id), role: parsed.data.role },
          timestamp: new Date().toISOString()
        })
      } catch {}
    } else {
      await logAudit({
        action: 'user.update',
        actorId: ctx.userId,
        targetId: id,
        details: { fields: Object.keys(data) }
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
})
