import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/tenant-cookie', () => ({ verifyTenantCookie: vi.fn(() => false) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

describe('Tenant mismatch — bookings endpoints', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('admin bookings GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/bookings/route')
    const req = new Request('https://test.local/api/admin/bookings', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })

  it('bookings proxy GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/bookings/route')
    const req = new Request('https://test.local/api/bookings', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })
})
