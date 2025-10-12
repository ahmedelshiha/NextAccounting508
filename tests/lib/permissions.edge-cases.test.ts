import { describe, it, expect } from 'vitest'
import { hasRole, hasPermission, checkPermissions, getRolePermissions, PERMISSIONS } from '@/lib/permissions'

describe('permissions utilities edge cases', () => {
  it('hasRole: false for undefined role', () => {
    expect(hasRole(undefined, ['ADMIN'])).toBe(false)
    expect(hasRole(null, ['ADMIN'] as any)).toBe(false)
  })

  it('hasRole: false for undefined/empty allowedRoles', () => {
    expect(hasRole('ADMIN', undefined as any)).toBe(false)
    expect(hasRole('ADMIN', [] as any)).toBe(false)
  })

  it('hasRole: true when role present in list', () => {
    expect(hasRole('ADMIN', ['TEAM_LEAD', 'ADMIN'])).toBe(true)
  })

  it('hasPermission: false for empty/unknown role', () => {
    expect(hasPermission('', PERMISSIONS.SERVICES_VIEW as any)).toBe(false)
    expect(hasPermission(undefined, PERMISSIONS.SERVICES_VIEW)).toBe(false)
    expect(hasPermission(null, PERMISSIONS.SERVICES_VIEW as any)).toBe(false)
  })

  it('checkPermissions: handles duplicates correctly', () => {
    const perms = [PERMISSIONS.SERVICE_REQUESTS_CREATE, PERMISSIONS.SERVICE_REQUESTS_CREATE]
    expect(checkPermissions('CLIENT', perms)).toBe(true)
    expect(checkPermissions('TEAM_MEMBER', [PERMISSIONS.USERS_MANAGE, PERMISSIONS.USERS_MANAGE])).toBe(false)
  })

  it('getRolePermissions: returns empty for null/unknown roles', () => {
    expect(getRolePermissions(undefined)).toEqual([])
    expect(getRolePermissions('UNKNOWN' as any)).toEqual([])
  })
})
