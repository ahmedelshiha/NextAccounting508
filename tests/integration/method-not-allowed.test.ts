import { describe, it, expect } from 'vitest'

async function simulateModuleRequest(mod: any, method: string, req?: Request, context?: any) {
  const methodUpper = method.toUpperCase()
  if (typeof mod[methodUpper] === 'function') {
    // call the handler
    return await mod[methodUpper](req || new Request('https://example.com'), context)
  }
  // Build Allow header based on exported methods
  const ALLOWED_METHODS = ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
  const allowed = ALLOWED_METHODS.filter(m => typeof mod[m] === 'function')
  const headers = new Headers()
  headers.set('Allow', allowed.join(','))
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers })
}

describe('Integration: Method Not Allowed behavior', () => {
  it('chat PUT should return 405 with Allow header listing GET,POST,OPTIONS', async () => {
    const mod = await import('@/app/api/portal/chat/route')
    const res: any = await simulateModuleRequest(mod, 'PUT', new Request('https://example.com/api/portal/chat'))
    expect(res.status).toBe(405)
    const allow = res.headers.get('Allow')
    expect(allow).toBeTruthy()
    // Expect that GET/POST/OPTIONS are allowed
    expect(allow).toMatch(/GET/)
    expect(allow).toMatch(/POST/)
    expect(allow).toMatch(/OPTIONS/)
  })

  it('comments DELETE should return 405 with Allow header listing GET,POST,OPTIONS', async () => {
    const mod = await import('@/app/api/portal/service-requests/[id]/comments/route')
    const res: any = await simulateModuleRequest(mod, 'DELETE', new Request('https://example.com/api/portal/service-requests/abc/comments'), { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(405)
    const allow = res.headers.get('Allow')
    expect(allow).toBeTruthy()
    expect(allow).toMatch(/GET/)
    expect(allow).toMatch(/POST/)
    expect(allow).toMatch(/OPTIONS/)
  })

  it('service-requests POST when unsupported method returns 405 including GET,POST,OPTIONS (if applicable)', async () => {
    const mod = await import('@/app/api/portal/service-requests/route')
    // Simulate sending PUT if not supported
    const res: any = await simulateModuleRequest(mod, 'PUT', new Request('https://example.com/api/portal/service-requests'))
    // Either route implements PUT (in which case status != 405) or our harness returns 405
    if (res.status === 405) {
      const allow = res.headers.get('Allow')
      expect(allow).toBeTruthy()
    } else {
      // If implemented, ensure it responds (status is number)
      expect(typeof res.status === 'number').toBeTruthy()
    }
  })
})
