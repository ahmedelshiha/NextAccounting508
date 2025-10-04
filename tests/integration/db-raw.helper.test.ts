import { describe, it, expect, vi, beforeEach } from 'vitest'

let lastQuery: { sql: any; values: any[] } | null = null

vi.doMock('@/lib/prisma', () => ({
  default: {
    $transaction: async (cb: any) => {
      const tx = {
        $queryRaw: vi.fn(async (...args: any[]) => {
          lastQuery = { sql: args[0], values: args.slice(1) }
          return []
        }),
        $executeRaw: vi.fn(async (...args: any[]) => {
          lastQuery = { sql: args[0], values: args.slice(1) }
          return 1
        })
      }
      return cb(tx)
    }
  }
}))

describe('db-raw helpers', () => {
  beforeEach(() => { lastQuery = null })

  it('queryTenantRaw runs inside withTenantRLS and forwards template + params', async () => {
    const { queryTenantRaw } = await import('@/lib/db-raw')
    const rows = await queryTenantRaw`SELECT 1 WHERE 'x' = ${'x'}`
    expect(Array.isArray(rows)).toBe(true)
    expect(lastQuery).not.toBeNull()
    expect(String((lastQuery as any).sql?.strings?.[0] ?? (lastQuery as any).sql)).toMatch(/SELECT 1/)
    expect((lastQuery as any).values?.[0]).toBe('x')
  })

  it('executeTenantRaw prefers $executeRaw when available', async () => {
    const { executeTenantRaw } = await import('@/lib/db-raw')
    const res = await executeTenantRaw`SELECT 1`
    expect(res).toBe(1)
  })
})
