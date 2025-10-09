import { describe, it, expect } from 'vitest'
import { hasPermission, checkPermissions, getRolePermissions, hasRole, PERMISSIONS } from '@/lib/permissions'

describe('permissions utilities', () => {
  it('hasPermission returns true for ADMIN for any permission', () => {
    const anyPerm = PERMISSIONS.SERVICES_VIEW
    expect(hasPermission('ADMIN', anyPerm)).toBe(true)
  })

  it('hasPermission returns false for missing role', () => {
    expect(hasPermission(undefined, PERMISSIONS.SERVICES_VIEW)).toBe(false)
    expect(hasPermission(null, PERMISSIONS.SERVICES_VIEW)).toBe(false)
  })

  it('checkPermissions returns true when all required permissions present', () => {
    const perms = [PERMISSIONS.SERVICES_VIEW, PERMISSIONS.ANALYTICS_VIEW]
    expect(checkPermissions('TEAM_MEMBER', perms)).toBe(true)
  })

  it('checkPermissions returns false when any required permission missing', () => {
    const perms = [PERMISSIONS.SERVICES_VIEW, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT]
    expect(checkPermissions('TEAM_MEMBER', perms)).toBe(false)
  })

  it('getRolePermissions returns an array for known role and empty for unknown', () => {
    const teamPerms = getRolePermissions('TEAM_MEMBER')
    expect(Array.isArray(teamPerms)).toBe(true)
    expect(teamPerms.length).toBeGreaterThan(0)

    expect(getRolePermissions('UNKNOWN_ROLE')).toEqual([])
    expect(getRolePermissions(null)).toEqual([])
  })

  it('hasRole correctly checks allowed roles', () => {
    expect(hasRole('ADMIN', ['ADMIN', 'SUPER_ADMIN'])).toBe(true)
    expect(hasRole('TEAM_MEMBER', ['ADMIN'])).toBe(false)
    expect(hasRole(undefined, ['ADMIN'])).toBe(false)
  })
})
