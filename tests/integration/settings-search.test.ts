import { describe, it, expect } from 'vitest'
import { createRequest } from 'node-mocks-http'

// We'll import the route handler directly and invoke it with a mock request via withTenantContext wrapper
import handlerModule from '@/app/api/admin/settings/search/route'

// Note: This test ensures the handler function exists and returns a 400 for missing query
describe('Settings search route', () => {
  it('returns 400 when q param missing', async () => {
    // construct a Next.js-like Request URL
    const req = new Request('http://localhost/api/admin/settings/search')
    const res = await (handlerModule.GET as any)(req as any, { params: {} })
    // handler returns a NextResponse; convert to json
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(res.status).toBe(400)
  })
})
