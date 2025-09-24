import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

function makeReq(url?: string, headers?: Record<string,string>) {
  return {
    url: url || 'https://tenant.example.com/path',
    headers: {
      get(k: string) { return (headers && headers[k.toLowerCase()]) || null }
    }
  } as unknown as Request
}

describe('tenant helpers', () => {
  let originalEnv: string | undefined
  beforeEach(() => { originalEnv = process.env.MULTI_TENANCY_ENABLED })
  afterEach(() => { process.env.MULTI_TENANCY_ENABLED = originalEnv })

  it('extracts tenant from x-tenant-id header when present', () => {
    const req = makeReq(undefined, { 'x-tenant-id': 'hdr-tenant' })
    expect(getTenantFromRequest(req)).toBe('hdr-tenant')
  })

  it('extracts subdomain from hostname when header absent', () => {
    const req = makeReq('https://acme.example.com/foo')
    expect(getTenantFromRequest(req)).toBe('acme')
  })

  it('returns null when no tenant header and hostname has no subdomain', () => {
    const req = makeReq('https://example.com')
    expect(getTenantFromRequest(req)).toBeNull()
  })

  it('tenantFilter returns empty object when multi-tenancy disabled', () => {
    process.env.MULTI_TENANCY_ENABLED = 'false'
    expect(tenantFilter('abc')).toEqual({})
  })

  it('tenantFilter returns filter object when enabled and tenant provided', () => {
    process.env.MULTI_TENANCY_ENABLED = 'true'
    expect(tenantFilter('t1')).toEqual({ tenantId: 't1' })
  })
})
