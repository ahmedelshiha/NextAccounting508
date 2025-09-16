import { describe, it, expect } from 'vitest'
import { hasPermission, PERMISSIONS, getRolePermissions } from '@/lib/permissions'

describe('permissions helpers', () => {
  it('ADMIN has all permissions', () => {
    for (const p of Object.values(PERMISSIONS)) {
      expect(hasPermission('ADMIN', p)).toBe(true)
    }
  })

  it('CLIENT has limited permissions', () => {
    expect(hasPermission('CLIENT', PERMISSIONS.SERVICE_REQUESTS_CREATE)).toBe(true)
    expect(hasPermission('CLIENT', PERMISSIONS.SERVICE_REQUESTS_DELETE)).toBe(false)
  })

  it('returns role permissions list', () => {
    const perms = getRolePermissions('TEAM_LEAD')
    expect(Array.isArray(perms)).toBe(true)
    expect(perms.length).toBeGreaterThan(0)
  })
})
