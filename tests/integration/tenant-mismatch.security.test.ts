import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Ensure multi-tenancy code paths are enabled for fallback handlers
beforeEach(() => {
  process.env.MULTI_TENANCY_ENABLED = 'true'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Tenant security - invalid tenant_sig and header mismatches', () => {
  it('returns 403 when tenant_sig cookie is invalid on withTenantContext route', async () => {
    // Mock session with tenant-bound user
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    const mod = await import('@/app/api/admin/services/route')
    const req = new Request('https://test.local/api/admin/services', {
      headers: {
        // Provide an invalid signature cookie to trigger verification failure
        cookie: 'tenant_sig=invalid',
      } as any,
    })

    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(String(body?.message || '')).toMatch(/Invalid tenant signature/i)
  })

  it('ignores forged x-tenant-id header and uses session tenant (fallback data)', async () => {
    // Mock session with tenant t1
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u2', role: 'ADMIN', tenantId: 't1', tenantRole: 'OWNER' } })) }))

    // Seed fallback requests: 2 for t1, 1 for t2
    const { addRequest } = await import('@/lib/dev-fallbacks')
    const now = new Date().toISOString()
    addRequest('r1', { id: 'r1', title: 'T1-1', tenantId: 't1', createdAt: now })
    addRequest('r2', { id: 'r2', title: 'T1-2', tenantId: 't1', createdAt: now })
    addRequest('r3', { id: 'r3', title: 'T2-1', tenantId: 't2', createdAt: now })

    const mod = await import('@/app/api/admin/service-requests/route')

    // Attempt to force tenant via header to t2; wrapper should ignore and use session tenantId=t1
    const req = new Request('https://test.local/api/admin/service-requests?type=requests&page=1&limit=100', {
      headers: {
        'x-tenant-id': 't2',
      } as any,
    })

    const res: any = await mod.GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body?.data)).toBe(true)
    // Should only include t1 items (2 entries)
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    const ids = body.data.map((x: any) => x.id)
    expect(ids).toEqual(expect.arrayContaining(['r1', 'r2']))
    // Ensure t2 item is not present when using session tenant
    expect(ids).not.toContain('r3')
  })
})
