import { NextRequest } from 'next/server'
import { verifySuperAdminStepUp } from '@/lib/security/step-up'

vi.mock('@/lib/mfa', () => ({
  getUserMfaSecret: vi.fn(async () => 'S'),
  verifyTotp: vi.fn((s: string, code: string) => s === 'S' && code === '000111'),
  consumeBackupCode: vi.fn(async () => false)
}))

describe('verifySuperAdminStepUp with tenantId', () => {
  beforeEach(() => {
    delete (process.env as any).SUPERADMIN_STEPUP_MFA
  })

  it('uses tenant-level setting when present and requires OTP', async () => {
    vi.mocked(await import('@/services/security-settings.service')).default.get = vi.fn(async (tenantId: string) => ({ superAdmin: { stepUpMfa: true } }))

    const req = new NextRequest('http://localhost/test')
    const ok = await verifySuperAdminStepUp(req as any, 'u1', 't1')
    expect(ok).toBe(false)

    const req2 = new NextRequest('http://localhost/test', { headers: { 'x-mfa-otp': '000111' } } as any)
    const ok2 = await verifySuperAdminStepUp(req2 as any, 'u1', 't1')
    expect(ok2).toBe(true)
  })

  it('falls back to env when tenant has no explicit setting', async () => {
    // tenant service returns null
    vi.mocked(await import('@/services/security-settings.service')).default.get = vi.fn(async (_tenantId: string) => null)
    process.env.SUPERADMIN_STEPUP_MFA = 'true'

    const req = new NextRequest('http://localhost/test')
    const ok = await verifySuperAdminStepUp(req as any, 'u1', 't1')
    expect(ok).toBe(false)

    const req2 = new NextRequest('http://localhost/test', { headers: { 'x-mfa-otp': '000111' } } as any)
    const ok2 = await verifySuperAdminStepUp(req2 as any, 'u1', 't1')
    expect(ok2).toBe(true)
  })
})
