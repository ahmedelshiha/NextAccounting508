import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as commentsPOST, OPTIONS as commentsOPTIONS } from '@/app/api/portal/service-requests/[id]/comments/route'
import { POST as chatPOST, OPTIONS as chatOPTIONS } from '@/app/api/portal/chat/route'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/prisma', () => ({
  serviceRequest: { findUnique: vi.fn() },
  serviceRequestComment: { create: vi.fn() },
  booking: { findUnique: vi.fn() }
}))

import prisma from '@/lib/prisma'

function makeReq({ url = 'https://app.example.com', headers = {}, body = {} } = {}) {
  return {
    url,
    headers: {
      get(k: string) {
        return headers[k.toLowerCase()] ?? null
      }
    },
    json: async () => body,
  } as unknown as Request
}

describe('Portal comments & chat negative tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('comments POST returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as any)
    const req = makeReq({ url: 'https://app.example.com/api/portal/service-requests/abc/comments', body: { content: 'hi' } })
    const res: any = await commentsPOST(req as any, { params: Promise.resolve({ id: 'abc' }) } as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('comments OPTIONS returns Allow header with GET,POST,OPTIONS', async () => {
    const res: any = await commentsOPTIONS()
    expect(res.status).toBe(204)
    const allow = res.headers.get('Allow')
    expect(allow).toBeDefined()
    expect(allow).toContain('GET')
    expect(allow).toContain('POST')
    expect(allow).toContain('OPTIONS')
  })

  it('chat POST returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as any)
    const req = makeReq({ url: 'https://app.example.com/api/portal/chat', body: { message: 'hello' } })
    const res: any = await chatPOST(req as any)
    expect(res.status).toBe(401)
    const text = await res.text()
    expect(text).toBe('Unauthorized')
  })

  it('chat OPTIONS returns Allow header with GET,POST,OPTIONS', async () => {
    const res: any = await chatOPTIONS()
    expect(res.status).toBe(204)
    const allow = res.headers.get('Allow')
    expect(allow).toBeDefined()
    expect(allow).toContain('GET')
    expect(allow).toContain('POST')
    expect(allow).toContain('OPTIONS')
  })

  it('chat route does not export PUT — server should respond 405 to unsupported methods', async () => {
    // Assert that PUT handler is not exported (simulates unsupported method)
    const mod = await import('@/app/api/portal/chat/route')
    expect(mod.PUT).toBeUndefined()
  })
})
