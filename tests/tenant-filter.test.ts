import { expect, test } from 'vitest'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'

test('tenantFilter returns empty when multi-tenancy disabled or no tenantId', () => {
  process.env.MULTI_TENANCY_ENABLED = 'false'
  expect(isMultiTenancyEnabled()).toBe(false)
  expect(tenantFilter(null)).toEqual({})
  expect(tenantFilter('')).toEqual({})
})

test('tenantFilter returns object when enabled and tenantId provided', () => {
  process.env.MULTI_TENANCY_ENABLED = 'true'
  expect(isMultiTenancyEnabled()).toBe(true)
  const t = tenantFilter('tenant-123')
  expect(t).toHaveProperty('tenantId', 'tenant-123')
})
