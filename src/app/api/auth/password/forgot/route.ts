import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getResolvedTenantId, userByTenantEmail } from '@/lib/tenant'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'
import { createHash, randomBytes } from 'crypto'

const schema = z.object({ email: z.string().email() })

const _api_POST = async (req: NextRequest) => {
  try {
    const ip = getClientIp(req as unknown as Request)
    const key = `auth:forgot:${ip}`
    const forgotLimit = await applyRateLimit(key, 5, 60_000)
    if (!forgotLimit.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', details: { ip, key, route: new URL(req.url).pathname } }) } catch {}
      return NextResponse.json({ ok: true })
    }

    const json = await req.json().catch(() => ({}))
    const parse = schema.safeParse(json)
    if (!parse.success) return NextResponse.json({ ok: true })

    const tenantId = await getResolvedTenantId(req)
    const email = parse.data.email.toLowerCase()

    const user = await prisma.user.findUnique({ where: userByTenantEmail(tenantId, email), select: { id: true, email: true, name: true } })

    // Always respond with ok to prevent user enumeration
    if (!user) return NextResponse.json({ ok: true })

    // Build token and store hashed in VerificationToken
    const token = randomBytes(32).toString('hex')
    const hashed = createHash('sha256').update(token).digest('hex')
    const identifier = `${tenantId}:${email}:password_reset`

    // Cleanup previous tokens for this identifier
    await prisma.verificationToken.deleteMany({ where: { identifier } }).catch(() => {})

    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await prisma.verificationToken.create({ data: { identifier, token: hashed, expires } })

    // Compose reset URL
    const origin = req.nextUrl.origin
    const resetUrl = new URL('/reset-password', origin)
    resetUrl.searchParams.set('token', token)

    // Send email (uses SendGrid when configured; otherwise logs)
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Hello${user.name ? ' ' + user.name : ''},</p>
        <p>We received a request to reset your password. Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl.toString()}">Reset your password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: true })
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
export const POST = withTenantContext(_api_POST, { requireAuth: false })
