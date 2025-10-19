import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { logAudit } from '@/lib/audit'
import { NextResponse } from 'next/server'

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // CSRF: same-origin only
    try { const { isSameOrigin } = await import('@/lib/security/csrf'); if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) } catch {}

    // Rate limit: 10 toggles/hour per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:security:2fa:${ip}`, 10, 3600_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ ok: true })

    const body = (await request.json().catch(() => ({}))) as { enable?: boolean }
    const enable = body.enable === true

    if (enable) {
      return NextResponse.json({ error: 'Use POST /api/user/security/authenticator to enroll then verify via /api/auth/mfa/verify' }, { status: 400 })
    }

    try {
      const { clearUserMfa } = await import('@/lib/mfa')
      await clearUserMfa(String(ctx.userId))
    } catch (e) {}

    await prisma.userProfile.upsert({
      where: { userId: String(ctx.userId) },
      create: { userId: String(ctx.userId), twoFactorEnabled: false },
      update: { twoFactorEnabled: false },
    })

    try { await logAudit({ action: 'mfa.disable', actorId: String(ctx.userId), targetId: String(ctx.userId) }) } catch {}

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/user/security/2fa error', err)
    return NextResponse.json({ error: 'Failed to toggle 2FA' }, { status: 500 })
  }
})
