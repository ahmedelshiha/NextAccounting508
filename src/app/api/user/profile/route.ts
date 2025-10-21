import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { NextResponse } from 'next/server'

const putSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  organization: z.string().min(1).max(200).optional(),
})

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // Rate limit: 60 req/min per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:profile:get:${ip}`, 60, 60_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      const user = {
        id: ctx.userId as string,
        name: (ctx as any).userName ?? null,
        email: (ctx as any).userEmail ?? null,
        role: ctx.role,
        organization: (ctx as any).organization ?? null,
      }
      return NextResponse.json({ user })
    }

    const user = await prisma.user.findUnique({
      where: { id: String(ctx.userId) },
      select: {
        id: true, name: true, email: true, role: true, image: true, emailVerified: true,
        userProfile: { select: { organization: true, twoFactorEnabled: true } },
      },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const merged = { ...user, organization: user.userProfile?.organization ?? null, twoFactorEnabled: user.userProfile?.twoFactorEnabled ?? false }
    delete (merged as any).userProfile

    return NextResponse.json({ user: merged })
  } catch (err) {
    console.error('GET /api/user/profile error', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // CSRF: same-origin only
    try { const { isSameOrigin } = await import('@/lib/security/csrf'); if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) } catch {}

    // Rate limit: 20 writes/min per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:profile:put:${ip}`, 20, 60_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const json = await request.json().catch(() => ({}))
    const parsed = putSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const updatesUser: any = {}
    if (parsed.data.name !== undefined) updatesUser.name = parsed.data.name

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(updatesUser).length) {
        await tx.user.update({ where: { id: String(ctx.userId) }, data: updatesUser })
      }
      if (parsed.data.organization !== undefined) {
        await tx.userProfile.upsert({
          where: { userId: String(ctx.userId) },
          create: { userId: String(ctx.userId), organization: parsed.data.organization },
          update: { organization: parsed.data.organization },
        })
      }

      const u = await tx.user.findUnique({
        where: { id: String(ctx.userId) },
        select: { id: true, name: true, email: true, role: true, image: true, emailVerified: true, userProfile: { select: { organization: true, twoFactorEnabled: true } } },
      })
      return u!
    })

    const merged = { ...updated, organization: updated.userProfile?.organization ?? null, twoFactorEnabled: updated.userProfile?.twoFactorEnabled ?? false }
    delete (merged as any).userProfile

    try { await logAudit({ action: 'user.profile.update', actorId: String(ctx.userId), targetId: String(ctx.userId), details: { fields: Object.keys(parsed.data) } }) } catch {}

    return NextResponse.json({ user: merged })
  } catch (err) {
    console.error('PUT /api/user/profile error', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
})
