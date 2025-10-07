import { NextRequest, NextResponse } from 'next/server'
import { getUserMfaSecret, verifyTotp, consumeBackupCode } from '@/lib/mfa'
import { logAudit } from '@/lib/audit'

function readOtpFromHeaders(req: NextRequest): string | null {
  const candidates = [
    'x-mfa-otp',
    'x-mfa-code',
    'x-step-up-otp',
    'x-otp',
    'x-auth-otp',
  ]
  for (const name of candidates) {
    const v = req.headers.get(name)
    if (v && v.trim()) return v.trim()
  }
  return null
}

export async function verifySuperAdminStepUp(req: NextRequest, userId: string, tenantId?: string | null): Promise<boolean> {
  // Prefer tenant-level override (security settings) for the given tenantId if available; fall back to env flag.
  let enabled = false
  try {
    const svc = await import('@/services/security-settings.service')
    // If tenantId provided, consult that tenant explicitly; otherwise try default (null) as fallback
    const settings = tenantId ? await svc.default.get(tenantId).catch(() => null) : await svc.default.get(null).catch(() => null)
    if (settings && typeof (settings as any).superAdmin?.stepUpMfa === 'boolean') {
      enabled = Boolean((settings as any).superAdmin.stepUpMfa)
    } else {
      enabled = String(process.env.SUPERADMIN_STEPUP_MFA || '').toLowerCase() === 'true'
    }
  } catch {
    enabled = String(process.env.SUPERADMIN_STEPUP_MFA || '').toLowerCase() === 'true'
  }

  if (!enabled) return true
  try {
    const otp = readOtpFromHeaders(req)
    const secret = await getUserMfaSecret(userId)
    if (!secret) {
      await logAudit({ action: 'auth.mfa.stepup.no_secret', actorId: userId, targetId: userId })
      return false
    }
    if (!otp) {
      await logAudit({ action: 'auth.mfa.stepup.required', actorId: userId, targetId: userId })
      return false
    }
    const ok = verifyTotp(secret, otp) || (await consumeBackupCode(userId, otp))
    if (ok) {
      await logAudit({ action: 'auth.mfa.stepup.success', actorId: userId, targetId: userId })
    } else {
      await logAudit({ action: 'auth.mfa.stepup.failed', actorId: userId, targetId: userId })
    }
    return ok
  } catch {
    return false
  }
}

export function stepUpChallenge(): NextResponse {
  const res = NextResponse.json({ error: 'Step-up authentication required' }, { status: 401 })
  res.headers.set('x-step-up-required', 'mfa')
  res.headers.set('x-step-up-methods', 'totp,backup_code')
  return res
}
