import { NextResponse, type NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getUserMfaSecret, verifyTotp } from '@/lib/mfa'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const userId = ctx.userId ?? undefined
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 5 verification attempts per 15 minutes per IP (prevent brute force)
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(req as unknown as Request)
      const rl = await applyRateLimit(`user:mfa:verify:${ip}`, 5, 900_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: 'Too many verification attempts. Try again later.' }, { status: 429 })
    } catch {}

    const body = await req.json().catch(() => ({})) as any
    const code = String(body?.code || '')
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

    const secret = await getUserMfaSecret(String(userId))
    if (!secret) return NextResponse.json({ error: 'Not enrolled' }, { status: 400 })

    const ok = verifyTotp(secret, code)
    if (!ok) {
      try { await logAudit({ action: 'mfa.verify.failed', actorId: String(userId), targetId: String(userId) }) } catch {}
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    try { await logAudit({ action: 'mfa.verify.success', actorId: String(userId), targetId: String(userId) }) } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
})
