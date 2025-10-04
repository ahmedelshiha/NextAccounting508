import { describe, expect, it } from 'vitest'
import { authOptions } from '@/lib/auth'

describe('auth session callback', () => {
  it('populates session with tenant metadata and versions', async () => {
    const session = { user: { name: 'Tester', email: 'tester@example.com', image: null } } as any
    const token = {
      sub: 'user-123',
      role: 'ADMIN',
      tenantId: 'tenant-123',
      tenantSlug: 'tenant-123',
      tenantRole: 'OWNER',
      availableTenants: [
        { id: 'tenant-123', slug: 'tenant-123', name: 'Tenant 123', role: 'OWNER' },
        { id: 'tenant-456', slug: 'tenant-456', name: 'Tenant 456', role: 'ADMIN' },
      ],
      version: 7,
      sessionVersion: 3,
    } as any

    const sessionCallback = authOptions.callbacks?.session
    expect(sessionCallback).toBeInstanceOf(Function)
    const result = await sessionCallback!({ session, token } as any)

    expect(result?.user.id).toBe('user-123')
    expect(result?.user.role).toBe('ADMIN')
    expect((result?.user as any).tenantId).toBe('tenant-123')
    expect((result?.user as any).tenantSlug).toBe('tenant-123')
    expect((result?.user as any).tenantRole).toBe('OWNER')
    expect((result?.user as any).availableTenants).toEqual([
      { id: 'tenant-123', slug: 'tenant-123', name: 'Tenant 123', role: 'OWNER' },
      { id: 'tenant-456', slug: 'tenant-456', name: 'Tenant 456', role: 'ADMIN' },
    ])
    expect((result?.user as any).tokenVersion).toBe(7)
    expect((result?.user as any).sessionVersion).toBe(3)

    expect((result as any).tenantId).toBe('tenant-123')
    expect((result as any).tenantSlug).toBe('tenant-123')
    expect((result as any).tenantRole).toBe('OWNER')
    expect((result as any).availableTenants).toEqual([
      { id: 'tenant-123', slug: 'tenant-123', name: 'Tenant 123', role: 'OWNER' },
      { id: 'tenant-456', slug: 'tenant-456', name: 'Tenant 456', role: 'ADMIN' },
    ])
    expect((result as any).tokenVersion).toBe(7)
    expect((result as any).sessionVersion).toBe(3)
  })

  it('returns null when token is invalidated', async () => {
    const session = { user: { name: null, email: null, image: null } } as any
    const token = { invalidated: true } as any

    const sessionCallback = authOptions.callbacks?.session
    expect(sessionCallback).toBeInstanceOf(Function)
    const result = await sessionCallback!({ session, token } as any)

    expect(result).toBeNull()
  })
})
