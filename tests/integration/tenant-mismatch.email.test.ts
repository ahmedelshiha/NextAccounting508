import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/tenant-cookie', () => ({ verifyTenantCookie: vi.fn(() => false) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

describe('Tenant mismatch — email test endpoints', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /api/email/test returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/email/test/route')
    const req = new Request('https://test.local/api/email/test', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })

  it('POST /api/email/test returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/email/test/route')
    const req = new Request('https://test.local/api/email/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'tenant_sig=invalid' } as any,
      body: JSON.stringify({ type: 'basic', email: 'test@example.com' })
    })
    const res: any = await mod.POST(req as any)
    expect(res.status).toBe(403)
  })
})
