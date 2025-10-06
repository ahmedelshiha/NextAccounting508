import { describe, it, expect, vi, beforeAll } from 'vitest'

// For these tests, simulate unauthenticated requests
vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => null) }))
vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))

describe('withTenantContext - unauthenticated header-derived tenant context', () => {
  beforeAll(() => {
    vi.resetModules()
  })

  it('runs handler within tenantContext when x-tenant-id header is present and requireAuth=false', async () => {
    const { withTenantContext } = await import('@/lib/api-wrapper')
    const { tenantContext } = await import('@/lib/tenant-context')

    const handler = withTenantContext(async (request: Request) => {
      const ctx = tenantContext.getContext()
      return new Response(JSON.stringify({ tenantId: ctx.tenantId, userId: ctx.userId ?? null }), { status: 200 })
    }, { requireAuth: false })

    const req = new Request('https://example.com/api/public', {
      method: 'GET',
      headers: {
        'x-tenant-id': 't-test',
        'x-tenant-slug': 'acme',
        'x-request-id': 'r-123',
      }
    })

    const res: any = await (handler as any)(req, { params: {} })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tenantId).toBe('t-test')
    expect(body.userId).toBeNull()
  })

  it('falls back to running without tenant context when header is missing and requireAuth=false', async () => {
    const { withTenantContext } = await import('@/lib/api-wrapper')
    const { tenantContext } = await import('@/lib/tenant-context')

    const handler = withTenantContext(async (_request: Request) => {
      const hasCtx = !!tenantContext.getContextOrNull()
      return new Response(JSON.stringify({ hasContext: hasCtx }), { status: 200 })
    }, { requireAuth: false })

    const req = new Request('https://example.com/api/public', { method: 'GET' })
    const res: any = await (handler as any)(req, { params: {} })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.hasContext).toBe(false)
  })
})
