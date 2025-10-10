import { describe, it, expect } from 'vitest'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

function jsonResponse(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...(init || {}),
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
}

describe('withTenantContext unauthenticated header path', () => {
  it('establishes tenant context from headers and sets X-Request-ID', async () => {
    const handler = withTenantContext(async (req: Request) => {
      const ctx = requireTenantContext()
      return jsonResponse({ tenantId: ctx.tenantId, requestId: ctx.requestId || null })
    }, { requireAuth: false })

    const request = new Request('http://localhost/api/test', {
      headers: {
        'x-tenant-id': 'tenant-headers-test',
        'x-tenant-slug': 'tenant-slug',
      },
    }) as any

    const res = await handler(request, { params: {} } as any)
    expect(res).toBeInstanceOf(Response)
    expect(res.headers.get('X-Request-ID')).toBeTruthy()

    const body = await res.json() as { tenantId: string, requestId: string | null }
    expect(body.tenantId).toBe('tenant-headers-test')
    expect(typeof body.requestId === 'string' || body.requestId === null).toBe(true)
  })
})
