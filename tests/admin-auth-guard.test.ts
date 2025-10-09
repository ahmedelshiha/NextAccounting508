import { describe, it, expect, vi } from 'vitest'

// Mock authentication to return null for unauthenticated user
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => null)
}))
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => null)
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

describe('Auth wrapper guardrails', () => {
  it('unauthenticated admin system health returns 401', async () => {
    const { GET }: any = await import('@/app/api/admin/system/health/route')
    const res: any = await GET(new Request('https://x'))
    expect(res.status).toBe(401)
  })
})
