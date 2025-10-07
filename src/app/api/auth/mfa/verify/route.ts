import { NextResponse } from 'next/server'
import { NextResponse, NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getUserMfaSecret, verifyTotp } from '@/lib/mfa'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const userId = ctx.userId ?? undefined
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
