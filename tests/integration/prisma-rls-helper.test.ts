import { describe, it, expect, vi, beforeEach } from 'vitest'

let capturedTx: any = null

vi.doMock('@/lib/prisma', () => {
  return {
    default: {
      $transaction: async (cb: any) => {
        const tx = { $queryRaw: vi.fn(async () => [{ set_config: 'ok' }]) }
        capturedTx = tx
        return cb(tx)
      }
    }
  }
})

describe('Prisma RLS helpers', () => {
  beforeEach(() => {
    capturedTx = null
  })

  it('withTenantRLS sets session variable and runs callback', async () => {
    const { withTenantRLS } = await import('@/lib/prisma-rls')

    const result = await withTenantRLS(async (tx: any) => {
      expect(tx).toBe(capturedTx)
      return 'done'
    }, 't-xyz')

    expect(result).toBe('done')
    expect(capturedTx.$queryRaw).toHaveBeenCalledTimes(1)
    const call = (capturedTx.$queryRaw as any).mock.calls[0][0]
    expect(String(call?.strings?.[0] ?? call)).toMatch(/set_config\('app.current_tenant_id'/)
  })

  it('withTenantRLSRead sets session variable and runs callback with options', async () => {
    const { withTenantRLSRead } = await import('@/lib/prisma-rls')

    const result = await withTenantRLSRead(async (tx: any) => {
      expect(tx).toBe(capturedTx)
      return 'read-ok'
    }, { tenantId: 't-read', maxWaitMs: 100, timeoutMs: 200 })

    expect(result).toBe('read-ok')
    expect(capturedTx.$queryRaw).toHaveBeenCalledTimes(1)
    const call = (capturedTx.$queryRaw as any).mock.calls[0][0]
    expect(String(call?.strings?.[0] ?? call)).toMatch(/set_config\('app.current_tenant_id'/)
  })

  it('throws if tenantId is missing and no context', async () => {
    const { withTenantRLS } = await import('@/lib/prisma-rls')
    await expect(withTenantRLS(async () => 'x' as any)).rejects.toThrow(/tenantId missing/i)
  })
})
