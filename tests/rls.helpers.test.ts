import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setTenantRLSOnTx, withTenantRLS } from '@/lib/prisma-rls'
import { tenantContext } from '@/lib/tenant-context'

// Mock prisma to capture transaction usage
vi.mock('@/lib/prisma', () => {
  const client: any = {
    __lastTx: null,
    $transaction: vi.fn(async (fn: any) => {
      const tx = { $queryRaw: vi.fn(async () => []) }
      client.__lastTx = tx
      return fn(tx)
    }),
  }
  return { default: client }
})

describe('RLS helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('setTenantRLSOnTx sets app.current_tenant_id', async () => {
    const tx: any = { $queryRaw: vi.fn(async () => []) }
    await setTenantRLSOnTx(tx, 't1')
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    const first = tx.$queryRaw.mock.calls[0][0]
    expect(Array.isArray(first)).toBe(true)
    expect(String(first[0])).toContain("set_config('app.current_tenant_id'")
  })

  it('withTenantRLS applies tenant and executes callback within transaction', async () => {
    const prisma = (await import('@/lib/prisma')).default as any
    const result = await tenantContext.run({ tenantId: 't1', timestamp: new Date() } as any, async () => {
      return withTenantRLS(async (tx: any) => {
        expect(tx).toBeDefined()
        return 42
      })
    })
    expect(result).toBe(42)
    // Ensure set_config was invoked before or during callback
    const tx = prisma.__lastTx
    expect(tx).toBeTruthy()
    expect(tx.$queryRaw).toHaveBeenCalled()
    const first = tx.$queryRaw.mock.calls[0][0]
    expect(Array.isArray(first)).toBe(true)
    expect(String(first[0])).toContain("set_config('app.current_tenant_id'")
  })
})
