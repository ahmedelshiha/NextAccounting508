import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// Mock both next-auth and next-auth/next for compatibility
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'SUPER_ADMIN', tenantId: 't1' } }))
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => ({ 
    user: { 
      id: 'u1', 
      role: 'SUPER_ADMIN', 
      tenantId: 't1',
      tenantRole: 'SUPER_ADMIN'
    } 
  }))
}))

vi.mock('@/lib/mfa', () => ({
  getUserMfaSecret: vi.fn(async () => 'S'),
  verifyTotp: vi.fn((s: string, code: string) => s === 'S' && code === '000111'),
  consumeBackupCode: vi.fn(async () => false)
}))

vi.mock('@/services/security-settings.service', () => ({
  default: {
    upsert: vi.fn(async (_tenantId: string, data: any) => ({ tenantId: 't1', ...data })),
    get: vi.fn(async (_tenantId: string) => ({ 
      passwordPolicy: { minLength: 12 },
      sessionSecurity: {},
      twoFactor: {},
      network: {},
      dataProtection: {},
      compliance: {},
      superAdmin: {
        stepUpMfa: true,  // Enable step-up MFA
        logAdminAccess: true
      }
    }))
  }
}))

describe('SUPER_ADMIN step-up for security-settings PUT', () => {
  beforeEach(() => {
    process.env.SUPERADMIN_STEPUP_MFA = 'true'
  })

  it('requires step-up when no OTP header provided', async () => {
    const mod = await import('@/app/api/admin/security-settings/route')
    const payload = { passwordPolicy: { minLength: 14 } }
    const req = new NextRequest('http://localhost/api/admin/security-settings', { method: 'PUT', body: JSON.stringify(payload) } as any)
    const res: any = await mod.PUT(req as any)
    expect(res.status).toBe(401)
    expect(res.headers.get('x-step-up-required')).toBeTruthy()
  })

  it('accepts valid OTP header and updates settings', async () => {
    const mod = await import('@/app/api/admin/security-settings/route')
    const payload = { passwordPolicy: { minLength: 16 } }
    const req = new NextRequest('http://localhost/api/admin/security-settings', { method: 'PUT', body: JSON.stringify(payload), headers: { 'x-mfa-otp': '000111' } } as any)
    const res: any = await mod.PUT(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.passwordPolicy).toBeDefined()
    expect(json.passwordPolicy.minLength).toBe(16)
  })

  it('rejects invalid OTP header', async () => {
    const mod = await import('@/app/api/admin/security-settings/route')
    const payload = { passwordPolicy: { minLength: 16 } }
    const req = new NextRequest('http://localhost/api/admin/security-settings', { method: 'PUT', body: JSON.stringify(payload), headers: { 'x-mfa-otp': '999999' } } as any)
    const res: any = await mod.PUT(req as any)
    expect(res.status).toBe(401)
    expect(res.headers.get('x-step-up-required')).toBeTruthy()
  })
})
