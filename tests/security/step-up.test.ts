import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifySuperAdminStepUp } from '@/lib/security/step-up'
import { NextRequest } from 'next/server'

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

vi.mock('@/lib/mfa', () => ({
  getUserMfaSecret: vi.fn(async () => 'SECRET'),
  verifyTotp: vi.fn((secret: string, token: string) => secret === 'SECRET' && token === '123456'),
  consumeBackupCode: vi.fn(async (_userId: string, token: string) => token === 'backup-ok')
}))

describe('verifySuperAdminStepUp', () => {
  beforeEach(() => {
    delete (process.env as any).SUPERADMIN_STEPUP_MFA
  })

  it('passes through when disabled', async () => {
    const req = new NextRequest('http://localhost/test')
    const ok = await verifySuperAdminStepUp(req, 'u1')
    expect(ok).toBe(true)
  })

  it('requires OTP when enabled and no header', async () => {
    process.env.SUPERADMIN_STEPUP_MFA = 'true'
    const req = new NextRequest('http://localhost/test')
    const ok = await verifySuperAdminStepUp(req, 'u1')
    expect(ok).toBe(false)
  })

  it('accepts valid totp', async () => {
    process.env.SUPERADMIN_STEPUP_MFA = 'true'
    const req = new NextRequest('http://localhost/test', { headers: { 'x-mfa-otp': '123456' } as any })
    const ok = await verifySuperAdminStepUp(req, 'u1')
    expect(ok).toBe(true)
  })

  it('accepts valid backup code', async () => {
    process.env.SUPERADMIN_STEPUP_MFA = 'true'
    const req = new NextRequest('http://localhost/test', { headers: { 'x-mfa-otp': 'backup-ok' } as any })
    const ok = await verifySuperAdminStepUp(req, 'u1')
    expect(ok).toBe(true)
  })
})
