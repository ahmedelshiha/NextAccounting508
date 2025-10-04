import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

beforeEach(() => {
  process.env.MULTI_TENANCY_ENABLED = 'true'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Tenant security - portal and admin routes', () => {
  it('admin service-requests [id] GET returns 404 when item belongs to another tenant even if header forged', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const { addRequest } = await import('@/lib/dev-fallbacks')
    const now = new Date().toISOString()
    addRequest('srother', { id: 'srother', title: 'Other tenant SR', tenantId: 't2', createdAt: now })

    const mod = await import('@/app/api/admin/service-requests/[id]/route')
    const req = new Request('https://test.local/api/admin/service-requests/srother', { headers: { 'x-tenant-id': 't2' } as any })
    const res: any = await mod.GET(req as any, { params: Promise.resolve({ id: 'srother' }) } as any)
    expect(res.status).toBe(404)
  })

  it('admin service-requests [id] PATCH returns 404 when item belongs to another tenant', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const { addRequest } = await import('@/lib/dev-fallbacks')
    const now = new Date().toISOString()
    addRequest('srother2', { id: 'srother2', title: 'Other tenant SR2', tenantId: 't2', createdAt: now })

    const mod = await import('@/app/api/admin/service-requests/[id]/route')
    const req = new Request('https://test.local/api/admin/service-requests/srother2', { method: 'PATCH', body: JSON.stringify({ title: 'x' }) })
    const res: any = await mod.PATCH(req as any, { params: Promise.resolve({ id: 'srother2' }) } as any)
    expect(res.status).toBe(404)
  })

  it('portal service-requests GET ignores forged x-tenant-id and returns only session tenant items', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u-portal', role: 'USER', tenantId: 't1', tenantRole: 'MEMBER' } })) }))

    const { addRequest } = await import('@/lib/dev-fallbacks')
    const now = new Date().toISOString()
    addRequest('pr1', { id: 'pr1', title: 'P-T1-1', tenantId: 't1', clientId: 'u-portal', createdAt: now })
    addRequest('pr2', { id: 'pr2', title: 'P-T1-2', tenantId: 't1', clientId: 'u-portal', createdAt: now })
    addRequest('pr3', { id: 'pr3', title: 'P-T2-1', tenantId: 't2', clientId: 'u-portal', createdAt: now })

    const mod = await import('@/app/api/portal/service-requests/route')
    const req = new Request('https://test.local/api/portal/service-requests?page=1&limit=100', { headers: { 'x-tenant-id': 't2' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    const ids = body?.data?.map((x: any) => x.id) || []
    expect(ids).toEqual(expect.arrayContaining(['pr1','pr2']))
    expect(ids).not.toContain('pr3')
  })

  it('portal export route filters by session tenant', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u-portal', role: 'USER', tenantId: 't1', tenantRole: 'MEMBER' } })) }))

    const { addRequest } = await import('@/lib/dev-fallbacks')
    const now = new Date().toISOString()
    addRequest('pe1', { id: 'pe1', title: 'E-T1-1', tenantId: 't1', clientId: 'u-portal', createdAt: now })
    addRequest('pe2', { id: 'pe2', title: 'E-T2-1', tenantId: 't2', clientId: 'u-portal', createdAt: now })

    const mod = await import('@/app/api/portal/service-requests/export/route')
    const req = new Request('https://test.local/api/portal/service-requests/export', { headers: { 'x-tenant-id': 't2' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    const rows = Array.isArray(body?.rows) ? body.rows : []
    const ids = rows.map((r: any) => r.id)
    expect(ids).toContain('pe1')
    expect(ids).not.toContain('pe2')
  })

  it('portal realtime GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u-portal', role: 'USER', tenantId: 't1', tenantRole: 'MEMBER' } })) }))

    const mod = await import('@/app/api/portal/realtime/route')
    const req = new Request('https://test.local/api/portal/realtime', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })

  it('portal chat GET returns 403 on invalid tenant_sig', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u-portal', role: 'USER', tenantId: 't1', tenantRole: 'MEMBER' } })) }))

    const mod = await import('@/app/api/portal/chat/route')
    const req = new Request('https://test.local/api/portal/chat', { headers: { cookie: 'tenant_sig=invalid' } as any })
    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
  })
})
