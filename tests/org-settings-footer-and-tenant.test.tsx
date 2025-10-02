import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderDOM } from '@/test-mocks/dom'
import { OptimizedFooter } from '@/components/ui/optimized-footer'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { validateImportWithSchema } from '@/lib/settings/export'
import { OrganizationSettingsSchema } from '@/schemas/settings/organization'

// Footer reflection tests
describe('OptimizedFooter reflection', () => {
  let cleanup: (() => void) | null = null
  afterEach(() => { if (cleanup) cleanup(); cleanup = null })

  it('renders org name and legal links from props', () => {
    const { container, unmount } = renderDOM(
      <OptimizedFooter
        orgName="Acme Incorporated"
        contactEmail="hello@acme.test"
        contactPhone="+15550123"
        legalLinks={{ privacy: '/legal/privacy', terms: '/legal/terms' }}
      />
    )
    cleanup = unmount
    const text = container.textContent || ''
    expect(text).toContain('Acme Incorporated')

    const anchors = Array.from(container.querySelectorAll('a')) as HTMLAnchorElement[]
    const privacy = anchors.find(a => /privacy/i.test(a.textContent || ''))
    const terms = anchors.find(a => /terms/i.test(a.textContent || ''))
    expect(privacy?.getAttribute('href')).toBe('/legal/privacy')
    expect(terms?.getAttribute('href')).toBe('/legal/terms')
  })
})

// Tenant isolation unit tests
describe('tenant utils', () => {
  const OLD_ENV = { ...process.env }
  beforeEach(() => { process.env = { ...OLD_ENV } })
  afterEach(() => { process.env = OLD_ENV })

  it('extracts tenant from subdomain in Request URL', () => {
    const req = new Request('https://tenant1.example.com/some')
    const t = getTenantFromRequest(req)
    expect(t).toBe('tenant1')
  })

  it('tenantFilter respects MULTI_TENANCY_ENABLED=false', () => {
    process.env.MULTI_TENANCY_ENABLED = 'false'
    expect(tenantFilter('abc')).toEqual({})
  })

  it('tenantFilter scopes when MULTI_TENANCY_ENABLED=true and tenant provided', () => {
    process.env.MULTI_TENANCY_ENABLED = 'true'
    expect(tenantFilter('abc')).toEqual({ tenantId: 'abc' })
  })
})

// Import validation tightening tests
describe('OrganizationSettings import validation', () => {
  it('accepts strict legalLinks object with allowed keys', () => {
    const ok = validateImportWithSchema({ data: { branding: { legalLinks: { terms: 'https://example.com/terms', privacy: 'https://example.com/privacy' } } } }, OrganizationSettingsSchema)
    expect(ok.branding?.legalLinks?.terms).toBe('https://example.com/terms')
  })

  it('rejects invalid legalLinks shape (record with unknown keys)', () => {
    // @ts-expect-error testing runtime validation of unexpected key
    const bad = { data: { branding: { legalLinks: { foo: 'https://x', terms: 'https://y' } } } }
    expect(() => validateImportWithSchema(bad as any, OrganizationSettingsSchema)).toThrowError()
  })
})
