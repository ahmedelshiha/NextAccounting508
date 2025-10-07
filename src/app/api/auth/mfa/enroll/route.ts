import { NextResponse, type NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { generateTotpSecret, setUserMfaSecret, generateBackupCodes } from '@/lib/mfa'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const userId = ctx.userId ?? undefined
    const role = ctx.role ?? undefined
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!role || (role.toUpperCase() !== 'ADMIN' && role.toUpperCase() !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { secret, uri } = generateTotpSecret()
    await setUserMfaSecret(String(userId), secret)
    const codes = await generateBackupCodes(String(userId), 5)
    try { await logAudit({ action: 'mfa.enroll', actorId: String(userId), targetId: String(userId), details: { methods: ['totp'], codes: codes.length } }) } catch {}
    return NextResponse.json({ ok: true, secret, uri, backupCodes: codes })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
})
