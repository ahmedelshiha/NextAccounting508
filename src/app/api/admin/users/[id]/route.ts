import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission } from '@/lib/rbac'
import { logAudit } from '@/lib/audit'
import { userUpdateSchema } from '@/lib/validation'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || !hasPermission(role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const { id } = await context.params

    // Rate limit role updates by client IP
    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`role:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({}))
    const parsed = roleUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const newRole = parsed.data.role

    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    await logAudit({
      action: 'user.role.update',
      actorId: session.user.id,
      targetId: id,
      details: { from: role, to: newRole }
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
