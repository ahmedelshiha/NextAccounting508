import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { userUpdateSchema } from '@/lib/validation'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || !hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const { id } = await context.params

    // Tenant guard: ensure the target user belongs to current tenant when enabled
    const tenantId = getTenantFromRequest(request as unknown as Request)
    const existing = await prisma.user.findFirst({ where: { id, ...tenantFilter(tenantId) }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Rate limit role updates by client IP
    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`role:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({}))
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
        actorId: session.user.id,
        targetId: id,
        details: { to: parsed.data.role }
      })
    } else {
      await logAudit({
        action: 'user.update',
        actorId: session.user.id,
        targetId: id,
        details: { fields: Object.keys(data) }
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
