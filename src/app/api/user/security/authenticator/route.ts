import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { logAudit } from '@/lib/audit'
import { NextResponse } from 'next/server'

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // CSRF check
    try { const { isSameOrigin } = await import('@/lib/security/csrf'); if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) } catch {}

    // Rate limit: 5 enroll/hour
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:authenticator:post:${ip}`, 5, 3600_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ ok: true, secret: 'TEST', uri: 'otpauth://totp/TEST?secret=TEST', backupCodes: [] })
    }

    const { generateTotpSecret, setUserMfaSecret, generateBackupCodes } = await import('@/lib/mfa')
    const { secret, uri } = generateTotpSecret()
    await setUserMfaSecret(String(ctx.userId), secret)
    const backupCodes = await generateBackupCodes(String(ctx.userId), 5)

    // Do not enable until verified; ensure profile row exists
    await prisma.userProfile.upsert({ where: { userId: String(ctx.userId) }, create: { userId: String(ctx.userId), twoFactorEnabled: false }, update: {} })

    try { await logAudit({ action: 'mfa.enroll', actorId: String(ctx.userId), targetId: String(ctx.userId), details: { methods: ['totp'], codes: backupCodes.length } }) } catch {}

    return NextResponse.json({ ok: true, secret, uri, backupCodes })
  } catch (err) {
    console.error('POST /api/user/security/authenticator error', err)
    return NextResponse.json({ error: 'Failed to set up authenticator' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()

    // CSRF check
    try { const { isSameOrigin } = await import('@/lib/security/csrf'); if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) } catch {}

    // Rate limit: 5 deletes/day
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:authenticator:delete:${ip}`, 5, 86_400_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ ok: true })

    try { const { clearUserMfa } = await import('@/lib/mfa'); await clearUserMfa(String(ctx.userId)) } catch {}

    await prisma.userProfile.upsert({ where: { userId: String(ctx.userId) }, create: { userId: String(ctx.userId), twoFactorEnabled: false }, update: { twoFactorEnabled: false } })

    try { await logAudit({ action: 'mfa.remove', actorId: String(ctx.userId), targetId: String(ctx.userId) }) } catch {}

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/user/security/authenticator error', err)
    return NextResponse.json({ error: 'Failed to remove authenticator' }, { status: 500 })
  }
})
