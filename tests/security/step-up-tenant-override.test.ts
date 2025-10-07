import { NextRequest } from 'next/server'
import { verifySuperAdminStepUp } from '@/lib/security/step-up'

vi.mock('@/lib/mfa', () => ({
  getUserMfaSecret: vi.fn(async () => 'S'),
  verifyTotp: vi.fn((s: string, code: string) => s === 'S' && code === '000111'),
  consumeBackupCode: vi.fn(async () => false)
}))

vi.mock('@/services/security-settings.service', () => ({
  default: {
    get: vi.fn(async () => ({ superAdmin: { stepUpMfa: true } }))
  }
}))

describe('tenant-level step-up override', () => {
  beforeEach(() => {
    delete (process.env as any).SUPERADMIN_STEPUP_MFA
  })

  it('requires OTP when tenant override true and no header', async () => {
    const req = new NextRequest('http://localhost/test')
    const ok = await verifySuperAdminStepUp(req as any, 'u1')
    expect(ok).toBe(false)
  })

  it('accepts valid OTP when tenant override true', async () => {
    const req = new NextRequest('http://localhost/test', { headers: { 'x-mfa-otp': '000111' } } as any)
    const ok = await verifySuperAdminStepUp(req as any, 'u1')
    expect(ok).toBe(true)
  })
})
