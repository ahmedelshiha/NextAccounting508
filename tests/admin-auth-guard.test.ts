import { describe, it, expect } from 'vitest'

describe('Auth wrapper guardrails', () => {
  it('unauthenticated admin system health returns 401', async () => {
    const { GET }: any = await import('@/app/api/admin/system/health/route')
    const res: any = await GET(new Request('https://x'))
    expect(res.status).toBe(401)
  })
})
