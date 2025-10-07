import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTotpSecret, setUserMfaSecret, generateBackupCodes } from '@/lib/mfa'
import { logAudit } from '@/lib/audit'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!role || (role.toUpperCase() !== 'ADMIN' && role.toUpperCase() !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { secret, uri } = generateTotpSecret()
  await setUserMfaSecret(userId, secret)
  const codes = await generateBackupCodes(userId, 5)
  try { await logAudit({ action: 'mfa.enroll', actorId: userId, targetId: userId, details: { methods: ['totp'], codes: codes.length } }) } catch {}
  return NextResponse.json({ ok: true, secret, uri, backupCodes: codes })
}
