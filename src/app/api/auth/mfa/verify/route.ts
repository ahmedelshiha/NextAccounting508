import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserMfaSecret, verifyTotp } from '@/lib/mfa'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as any
  const code = String(body?.code || '')
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const secret = await getUserMfaSecret(userId)
  if (!secret) return NextResponse.json({ error: 'Not enrolled' }, { status: 400 })

  const ok = verifyTotp(secret, code)
  if (!ok) {
    try { await logAudit({ action: 'mfa.verify.failed', actorId: userId, targetId: userId }) } catch {}
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try { await logAudit({ action: 'mfa.verify.success', actorId: userId, targetId: userId }) } catch {}
  return NextResponse.json({ ok: true })
}
