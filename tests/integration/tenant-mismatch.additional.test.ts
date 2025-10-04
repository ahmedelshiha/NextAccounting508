vi.mock('@/lib/tenant-cookie', () => ({ verifyTenantCookie: vi.fn(() => false) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

describe('Tenant security - additional invalid tenant_sig cases', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('admin services POST returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/services/route')
    const req = new Request('https://test.local/api/admin/services', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.POST(req as any)
    expect(res.status).toBe(403)
  })

  it('admin users GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin2', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/users/route')
    const req = new Request('https://test.local/api/admin/users', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })

  it('admin invoices GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin3', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/invoices/route')
    const req = new Request('https://test.local/api/admin/invoices', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })

  it('admin settings/services POST returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin4', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/settings/services/route')
    const req = new Request('https://test.local/api/admin/settings/services', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.POST(req as any)
    expect(res.status).toBe(403)
  })

  it('portal service-requests POST returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u-portal', role: 'USER', tenantId: 't1', tenantRole: 'MEMBER' } })) }))

    const mod: any = await import('@/app/api/portal/service-requests/route')
    const req = new Request('https://test.local/api/portal/service-requests', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.POST(req as any)
    expect(res.status).toBe(403)
  })

  it('admin permissions GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin5', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/permissions/route')
    const req = new Request('https://test.local/api/admin/permissions', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })

  it('admin expenses DELETE returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin6', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod: any = await import('@/app/api/admin/expenses/route')
    const req = new Request('https://test.local/api/admin/expenses', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.DELETE(req as any)
    expect(res.status).toBe(403)
  })

  it('portal bookings GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u-portal-2', role: 'USER', tenantId: 't1', tenantRole: 'MEMBER' } })) }))

    const mod: any = await import('@/app/api/portal/bookings/route')
    const req = new Request('https://test.local/api/portal/bookings', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })
})
