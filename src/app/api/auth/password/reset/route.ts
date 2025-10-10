import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getResolvedTenantId, userByTenantEmail } from '@/lib/tenant'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

const schema = z.object({ token: z.string().min(32), password: z.string().min(8) })

const _api_POST = async (req: NextRequest) => {
  try {
    const ip = getClientIp(req as unknown as Request)
    const key = `auth:reset:${ip}`
    const resetLimit = await applyRateLimit(key, 5, 60_000)
    if (!resetLimit.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', details: { ip, key, route: new URL(req.url).pathname } }) } catch {}
      return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
    }

    const json = await req.json().catch(() => ({}))
    const parse = schema.safeParse(json)
    if (!parse.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const tenantId = await getResolvedTenantId(req)
    const hashed = createHash('sha256').update(parse.data.token).digest('hex')

    // Lookup by identifier + hashed token
    const identifierPrefix = `${tenantId}:
`
    // We stored identifier as `${tenantId}:${email}:password_reset` so we need to search by token then validate identifier startsWith tenantId
    const vt = await prisma.verificationToken.findFirst({ where: { token: hashed } })
    if (!vt || !vt.identifier.startsWith(identifierPrefix) || vt.expires < new Date()) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired token' }, { status: 400 })
    }

    const parts = vt.identifier.split(':')
    const email = parts[1]

    const user = await prisma.user.findUnique({ where: userByTenantEmail(tenantId, email), select: { id: true } })
    if (!user) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 400 })
    }

    const hashedPw = await bcrypt.hash(parse.data.password, 12)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { password: hashedPw, sessionVersion: { increment: 1 } } })
      await tx.verificationToken.deleteMany({ where: { identifier: vt.identifier } })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
export const POST = withTenantContext(_api_POST, { requireAuth: false })
