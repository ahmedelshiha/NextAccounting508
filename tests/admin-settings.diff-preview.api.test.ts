import { describe, it, expect, vi } from 'vitest'

// Mock rate limiter
const rateLimitMock = {
  calls: 0,
  impl: vi.fn(async () => true),
}
vi.mock('@/lib/rate-limit', () => ({
  rateLimitAsync: vi.fn(async (...args: any[]) => rateLimitMock.impl(...args)),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

// Mock json diff util (use simple array of keys changed if not present)
vi.mock('@/lib/diff', () => ({
  jsonDiff: (before: any, after: any) => {
    const changes: Array<{ path: string; before: any; after: any }> = []
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
    for (const k of keys) {
      if (JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])) {
        changes.push({ path: k, before: before?.[k], after: after?.[k] })
      }
    }
    return changes
  },
}))

// Mock auth and tenant context
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 'tenant1', tenantRole: 'OWNER' } })),
}))
vi.mock('@/lib/tenant-utils', () => ({
  requireTenantContext: vi.fn(() => ({ tenantId: 'tenant1', userId: 'admin1', role: 'ADMIN' })),
}))

const base = 'https://t.example.com'

describe('admin/settings/diff/preview API', () => {
  it('rejects invalid payload', async () => {
    const mod = await import('@/app/api/admin/settings/diff/preview/route')
    const res: any = await mod.POST(new Request(`${base}/api/admin/settings/diff/preview`, { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('returns diff summary for valid payload', async () => {
    const mod = await import('@/app/api/admin/settings/diff/preview/route')
    const body = { category: 'org', before: { a: 1, b: 2 }, after: { a: 1, b: 3, c: 4 } }
    const res: any = await mod.POST(new Request(`${base}/api/admin/settings/diff/preview`, { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.ok).toBe(true)
    expect(out.data.category).toBe('org')
    expect(out.data.count).toBeGreaterThan(0)
    expect(Array.isArray(out.data.changes)).toBe(true)
  })

  it('enforces rate limit (429)', async () => {
    const mod = await import('@/app/api/admin/settings/diff/preview/route')
    const { rateLimitAsync }: any = await import('@/lib/rate-limit')
    ;(rateLimitAsync as any).mockResolvedValue(false)

    const body = { category: 'org', before: { a: 1 }, after: { a: 2 } }
    const res: any = await mod.POST(new Request(`${base}/api/admin/settings/diff/preview`, { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(429)
  })
})
