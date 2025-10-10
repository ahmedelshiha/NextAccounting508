import { vi } from 'vitest'
import type { TenantContext } from '@/lib/tenant-context'

export const DEFAULT_TEST_TENANT = 'test-tenant'
export const DEFAULT_TEST_USER = 'test-user'

export function createMockTenantContext(overrides?: Partial<TenantContext>): TenantContext {
  return {
    tenantId: DEFAULT_TEST_TENANT,
    tenantSlug: 'test-tenant-slug',
    userId: DEFAULT_TEST_USER,
    userName: 'Test User',
    userEmail: 'test@example.com',
    role: 'ADMIN',
    tenantRole: 'OWNER',
    isSuperAdmin: false,
    requestId: 'req-test',
    timestamp: new Date(),
    ...overrides,
  }
}

export function setupTestTenantContext(context?: Partial<TenantContext>) {
  const session = {
    user: {
      id: String(context?.userId ?? DEFAULT_TEST_USER),
      name: context?.userName ?? 'Test User',
      email: context?.userEmail ?? 'test@example.com',
      role: context?.role ?? 'ADMIN',
      tenantId: context?.tenantId ?? DEFAULT_TEST_TENANT,
      tenantSlug: context?.tenantSlug ?? 'test-tenant-slug',
      tenantRole: context?.tenantRole ?? 'OWNER',
    },
  }

  try {
    const na = require('next-auth')
    if (na && na.getServerSession && typeof na.getServerSession.mockResolvedValue === 'function') {
      na.getServerSession.mockResolvedValue(session)
    }
  } catch {}

  try {
    const naNext = require('next-auth/next')
    if (naNext && naNext.getServerSession && typeof naNext.getServerSession.mockResolvedValue === 'function') {
      naNext.getServerSession.mockResolvedValue(session)
    }
  } catch {}

  // Also allow tests to override tenant context directly when needed
  try {
    const mod = require('@/lib/tenant-context') as any
    if (mod && mod.tenantContext && typeof mod.tenantContext.run === 'function') {
      // Provide a helper to run code within the provided context in tests
      ;(globalThis as any).__runWithTenantContext = (fn: () => any) => mod.tenantContext.run(createMockTenantContext(context), fn)
    }
  } catch {}
}
