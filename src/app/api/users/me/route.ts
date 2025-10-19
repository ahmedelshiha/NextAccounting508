import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  currentPassword: z.string().optional()
})

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // Rate limit: 60 req/min per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:me:get:${ip}`, 60, 60_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      // Return user info from session context in demo/no-DB mode
      const user = { id: ctx.userId as string, name: (ctx as any).userName ?? null, email: (ctx as any).userEmail ?? null, role: ctx.role }
      return NextResponse.json({ user })
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId as string },
      select: { id: true, name: true, email: true, role: true }
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('GET /api/users/me error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // CSRF: enforce same-origin for mutations
    try { const { isSameOrigin } = await import('@/lib/security/csrf'); if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) } catch {}

    // Rate limit: 20 changes/min per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:me:patch:${ip}`, 20, 60_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const json = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const updates: { name?: string; email?: string; password?: string } = {}
    const changingEmail = parsed.data.email && parsed.data.email !== undefined
    const changingPassword = parsed.data.password && parsed.data.password !== undefined

    // If changing sensitive data, require currentPassword
    if ((changingEmail || changingPassword) && !parsed.data.currentPassword) {
      return NextResponse.json({ error: 'Current password is required to change email or password' }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: ctx.userId as string },
      select: { id: true, password: true, email: true, tenantId: true }
    })
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if ((changingEmail || changingPassword)) {
      if (!currentUser.password) {
        return NextResponse.json({ error: 'No local password set for this account' }, { status: 400 })
      }
      const currentPassword = parsed.data.currentPassword as string
      const storedHash = currentUser.password as string
      const ok = await bcrypt.compare(currentPassword, storedHash)
      if (!ok) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 })
      }
    }

    if (parsed.data.name) updates.name = parsed.data.name
    if (changingEmail) {
      // check uniqueness within tenant
      const exists = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId: currentUser.tenantId as string, email: parsed.data.email as string } }
      })
      if (exists && exists.id !== ctx.userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      updates.email = parsed.data.email
    }
    if (changingPassword) {
      const newPassword = parsed.data.password as string
      const hashed = await bcrypt.hash(newPassword, 12)
      updates.password = hashed
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    // Increment sessionVersion to invalidate existing JWTs
    const updated = await prisma.user.update({
      where: { id: ctx.userId as string },
      data: { ...updates, sessionVersion: { increment: 1 } },
      select: { id: true, name: true, email: true, sessionVersion: true }
    })

    await logAudit({ action: 'user.profile.update', actorId: ctx.userId as string, targetId: updated.id, details: { updatedFields: Object.keys(updates) } })

    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('PATCH /api/users/me error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // CSRF: enforce same-origin for mutations
    try { const { isSameOrigin } = await import('@/lib/security/csrf'); if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) } catch {}

    // Rate limit: 5 deletes/day per IP window (simulate with long window)
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:me:delete:${ip}`, 5, 86_400_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const body = (await request.json().catch(() => ({}))) as { password?: string }
    const password = body.password
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Fetch user including password hash
    const user = await prisma.user.findUnique({ where: { id: ctx.userId as string }, select: { id: true, password: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!user.password) {
      // User signed up with OAuth or has no password set
      return NextResponse.json({ error: 'No local password set for this account. Please contact support.' }, { status: 400 })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const userId = ctx.userId as string

    // Delete the user. Cascades will remove related accounts, sessions, bookings, etc.
    await prisma.user.delete({ where: { id: userId } })

    await logAudit({ action: 'user.delete', actorId: userId, targetId: userId })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/users/me error', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
})
