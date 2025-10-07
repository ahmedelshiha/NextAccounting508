import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => [])
    }
  }
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'SUPER_ADMIN' } }))
}))

vi.mock('@/lib/mfa', () => ({
  getUserMfaSecret: vi.fn(async () => 'S'),
  verifyTotp: vi.fn((s: string, code: string) => s === 'S' && code === '000111'),
  consumeBackupCode: vi.fn(async () => false)
}))

describe('SUPER_ADMIN step-up routes', () => {
  beforeEach(() => {
    process.env.SUPERADMIN_STEPUP_MFA = 'true'
  })

  it('audit-logs requires step-up', async () => {
    const mod = await import('@/app/api/admin/audit-logs/route')
    const req1 = new NextRequest('http://localhost/api/admin/audit-logs')
    const res1 = await mod.GET(req1 as any)
    expect(res1.status).toBe(401)
    expect(res1.headers.get('x-step-up-required')).toBeTruthy()

    const req2 = new NextRequest('http://localhost/api/admin/audit-logs', { headers: { 'x-mfa-otp': '000111' } as any })
    const res2 = await mod.GET(req2 as any)
    expect(res2.status).toBe(200)
  })

  it('permissions roles requires step-up', async () => {
    const mod = await import('@/app/api/admin/permissions/roles/route')
    const req1 = new NextRequest('http://localhost/api/admin/permissions/roles')
    const res1 = await mod.GET(req1 as any)
    expect(res1.status).toBe(401)

    const req2 = new NextRequest('http://localhost/api/admin/permissions/roles', { headers: { 'x-mfa-otp': '000111' } as any })
    const res2 = await mod.GET(req2 as any)
    expect(res2.status).toBe(200)
  })
})
