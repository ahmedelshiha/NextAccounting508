import { describe, it, expect } from 'vitest'
import { hasPermission, checkPermissions, hasRole, getRolePermissions, PERMISSIONS } from '@/lib/permissions'

describe('permissions extra helpers', () => {
  it('checkPermissions returns true only when all are present', () => {
    expect(checkPermissions('ADMIN', [PERMISSIONS.SERVICES_VIEW, PERMISSIONS.SERVICES_CREATE])).toBe(true)
    expect(checkPermissions('CLIENT', [PERMISSIONS.SERVICE_REQUESTS_CREATE, PERMISSIONS.SERVICES_VIEW])).toBe(false)
  })

  it('hasRole returns true when role is allowed', () => {
    expect(hasRole('ADMIN', ['ADMIN','TEAM_LEAD'])).toBe(true)
    expect(hasRole('CLIENT', ['ADMIN','TEAM_LEAD'])).toBe(false)
  })

  it('getRolePermissions returns empty for unknown role', () => {
    expect(Array.isArray(getRolePermissions('UNKNOWN'))).toBe(true)
    expect(getRolePermissions(null)).toEqual([])
  })
})
