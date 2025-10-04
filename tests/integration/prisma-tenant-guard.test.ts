import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import type { Prisma } from '@prisma/client'
import { enforceTenantGuard } from '@/lib/prisma-tenant-guard'
import { tenantContext } from '@/lib/tenant-context'
import { logger } from '@/lib/logger'

describe('Prisma tenant guard middleware', () => {
  const originalMultiTenant = process.env.MULTI_TENANCY_ENABLED
  const baseContext = {
    tenantId: 'tenant-123',
    tenantSlug: 'tenant-123',
    userId: 'user-1',
    role: 'ADMIN',
    tenantRole: 'OWNER',
    isSuperAdmin: false,
    requestId: 'req-1',
    timestamp: new Date(),
  }

  beforeEach(() => {
    process.env.MULTI_TENANCY_ENABLED = 'true'
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env.MULTI_TENANCY_ENABLED = originalMultiTenant
  })

  function runWithContext(fn: () => void, overrides?: Partial<typeof baseContext>) {
    tenantContext.run({ ...baseContext, ...overrides }, fn)
  }

  function params(partial: Partial<Prisma.MiddlewareParams>): Prisma.MiddlewareParams {
    return {
      model: 'User',
      action: 'create',
      args: {},
      dataPath: [],
      runInTransaction: false,
      ...partial,
    }
  }

  it('throws when tenant context is missing', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    expect(() => enforceTenantGuard(params({ args: { data: { tenantId: 'tenant-123' } } }))).toThrowError(/tenant context/i)
    expect(errorSpy).toHaveBeenCalledWith('Tenant guard blocked operation due to missing tenant context', expect.objectContaining({ model: 'User', action: 'create' }))
  })

  it('auto injects tenantId on create when missing', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    runWithContext(() => {
      const args = { data: { email: 'admin@example.com' } }
      expect(() => enforceTenantGuard(params({ args }))).not.toThrow()
      expect(args.data.tenantId).toBe('tenant-123')
    })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('blocks create when tenantId mismatches context', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    runWithContext(() => {
      expect(() => enforceTenantGuard(params({ args: { data: { email: 'admin@example.com', tenantId: 'tenant-999' } } }))).toThrowError(/tenantId mismatch/i)
    })
    expect(errorSpy).toHaveBeenCalledWith('Tenant guard blocked tenant mismatch on create', expect.objectContaining({ model: 'User', action: 'create', expectedTenantId: 'tenant-123' }))
  })

  it('allows create when tenantId matches context', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    runWithContext(() => {
      expect(() => enforceTenantGuard(params({ args: { data: { tenantId: 'tenant-123', email: 'ok@example.com' } } }))).not.toThrow()
    })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('blocks bulk mutation without tenant filter', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    runWithContext(() => {
      expect(() => enforceTenantGuard(params({ action: 'updateMany', args: { where: { role: 'ADMIN' }, data: { role: 'CLIENT' } } }))).toThrowError(/bulk mutations require tenant filter/i)
    })
    expect(errorSpy).toHaveBeenCalledWith('Tenant guard blocked bulk mutation without tenant scope', expect.objectContaining({ model: 'User', action: 'updateMany' }))
  })

  it('warns on single-record mutation without tenantId filter', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    runWithContext(() => {
      expect(() => enforceTenantGuard(params({ action: 'update', args: { where: { id: 'user-1' }, data: { name: 'Updated' } } }))).not.toThrow()
    })
    expect(warnSpy).toHaveBeenCalledWith('Tenant guard detected single-record mutation without tenant filter', expect.objectContaining({ model: 'User', action: 'update', tenantId: 'tenant-123' }))
  })

  it('warns on read without tenant filter', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    runWithContext(() => {
      expect(() => enforceTenantGuard(params({ action: 'findMany', args: { where: { email: { contains: '@' } } } }))).not.toThrow()
    })
    expect(warnSpy).toHaveBeenCalledWith('Tenant guard detected read without tenant constraint', expect.objectContaining({ model: 'User', action: 'findMany', tenantId: 'tenant-123' }))
  })

  it('allows super admin to target different tenant on bulk operations when scoped', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    runWithContext(
      () => {
        expect(() => enforceTenantGuard(
          params({
            action: 'updateMany',
            args: { where: { tenantId: { equals: 'tenant-999' } }, data: { role: 'ADMIN' } },
          })
        )).not.toThrow()
      },
      { isSuperAdmin: true }
    )
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
