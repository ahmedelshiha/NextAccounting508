import { vi } from 'vitest'
import * as React from 'react'
import fs from 'fs'

// Ensure NEXTAUTH_SECRET for tenant cookie signing in tests
if (!process.env.NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = 'test-secret'

// Expose React globally for tests that perform SSR renders and rely on React being available
;(globalThis as any).React = React

// Expose fs helpers globally for tests that call readFileSync/writeFileSync without importing
;(globalThis as any).readFileSync = fs.readFileSync
;(globalThis as any).writeFileSync = fs.writeFileSync
;(globalThis as any).existsSync = fs.existsSync

// Default mocks to avoid Next.js headers() runtime issues in tests
const defaultSession = {
  user: {
    id: 'test-user',
    role: 'ADMIN',
    email: 'test@example.com',
    name: 'Test User',
    tenantId: 'test-tenant',
    tenantSlug: 'test-tenant-slug',
    tenantRole: 'OWNER',
    availableTenants: [{ id: 'test-tenant', slug: 'test-tenant-slug', name: 'Test Tenant', role: 'OWNER' }],
  },
}
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => defaultSession),
  // other exports if needed
}))

// Import centralized test setup that registers tenants and performs global cleanup
import './tests/testSetup'
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => defaultSession),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: defaultSession, status: 'authenticated' }),
  signOut: vi.fn()
}))
vi.mock('next-auth/jwt', () => {
  const encode = vi.fn(async ({ token }: { token?: Record<string, unknown> }) =>
    Buffer.from(JSON.stringify(token ?? {}), 'utf-8').toString('base64url')
  )
  const decode = vi.fn(async ({ token }: { token?: string }) => {
    try {
      const raw = Buffer.from(String(token ?? ''), 'base64url').toString('utf-8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  })
  return {
    getToken: vi.fn(async () => null),
    encode,
    decode,
  }
})

// Provide a lightweight mock for '@/lib/auth' so tests that mock other auth modules still function
vi.mock('@/lib/auth', async () => {
  let actual: any = {}
  try {
    actual = await vi.importActual('@/lib/auth')
  } catch (err) {
    // If importing the real module fails (e.g. DB/env side-effects), fall back to a minimal shape
    actual = {}
  }
  return {
    // Preserve actual exports when available (authOptions, helpers) so tests that import authOptions get the real callbacks
    ...actual,
    // Ensure getSessionOrBypass exists and delegates to next-auth mock when present
    getSessionOrBypass: async () => {
      try {
        // Prefer 'next-auth' mock when tests call vi.doMock('next-auth')
        try {
          const modA = await import('next-auth')
          if (modA && typeof modA.getServerSession === 'function') {
            const res = await modA.getServerSession()
            // Debug output to diagnose why some tests see no session
            // eslint-disable-next-line no-console
            console.log('[vitest.setup] getSessionOrBypass -> next-auth.getServerSession returned:', res)
            return res
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('[vitest.setup] import next-auth failed', err && (err as any).message)
        }
        // Some tests or code import 'next-auth/next'
        try {
          const modB = await import('next-auth/next')
          if (modB && typeof modB.getServerSession === 'function') {
            const res = await modB.getServerSession()
            // eslint-disable-next-line no-console
            console.log('[vitest.setup] getSessionOrBypass -> next-auth/next.getServerSession returned:', res)
            return res
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('[vitest.setup] import next-auth/next failed', err && (err as any).message)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('[vitest.setup] getSessionOrBypass unexpected error', err && (err as any).message)
      }
      return null
    },
  }
})

// Ensure permissions module exports exist for tests that partially mock it
vi.mock('@/lib/permissions', async () => {
  try {
    const actual = await vi.importActual('@/lib/permissions')
    return { ...(actual as any) }
  } catch (err) {
    // Fallback minimal permissions export to keep tests stable when importing the real module
    const PERMISSIONS = {
      SERVICE_REQUESTS_CREATE: 'service_requests.create',
      SERVICE_REQUESTS_READ_ALL: 'service_requests.read.all',
      SERVICE_REQUESTS_READ_OWN: 'service_requests.read.own',
      SERVICE_REQUESTS_UPDATE: 'service_requests.update',
      SERVICE_REQUESTS_DELETE: 'service_requests.delete',
      SERVICE_REQUESTS_ASSIGN: 'service_requests.assign',
      INTEGRATION_HUB_EDIT: 'integration.settings.edit',
      INTEGRATION_HUB_TEST: 'integration.settings.test',
      INTEGRATION_HUB_SECRETS_WRITE: 'integration.settings.secrets.write',
      // Add other commonly used permissions as permissive defaults
      ANALYTICS_VIEW: 'analytics.view',
      SERVICES_VIEW: 'services.view',
      SERVICES_EDIT: 'services.edit',
      BOOKING_SETTINGS_VIEW: 'booking.settings.view',
      ORG_SETTINGS_VIEW: 'org.settings.view',
    } as const

    const ROLE_PERMISSIONS: Record<string, any[]> = {
      CLIENT: [PERMISSIONS.SERVICE_REQUESTS_CREATE, PERMISSIONS.SERVICE_REQUESTS_READ_OWN],
      TEAM_MEMBER: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL],
      TEAM_LEAD: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL, PERMISSIONS.INTEGRATION_HUB_TEST],
      ADMIN: Object.values(PERMISSIONS),
      SUPER_ADMIN: Object.values(PERMISSIONS),
    }

    function hasPermission(userRole: string | undefined | null, permission: string) {
      if (!userRole) return false
      const allowed = ROLE_PERMISSIONS[userRole]
      return Array.isArray(allowed) ? allowed.includes(permission) : false
    }

    function checkPermissions(userRole: string | undefined | null, required: string[]) {
      return required.every(p => hasPermission(userRole, p))
    }

    function getRolePermissions(userRole: string | undefined | null) {
      if (!userRole) return []
      return ROLE_PERMISSIONS[userRole] ?? []
    }

    function hasRole(userRole: string | undefined | null, allowedRoles: readonly string[]) {
      if (!userRole || !allowedRoles) return false
      return allowedRoles.includes(userRole)
    }

    return {
      PERMISSIONS,
      ROLE_PERMISSIONS,
      hasPermission,
      checkPermissions,
      getRolePermissions,
      hasRole,
    }
  }
})

// Polyfill Web File in Node test env
if (typeof (globalThis as any).File === 'undefined') {
  class NodeFile extends Blob {
    name: string
    lastModified: number
    constructor(chunks: any[], name: string, options?: any) {
      super(chunks, options)
      this.name = name
      this.lastModified = Date.now()
    }
  }
  ;(globalThis as any).File = NodeFile as any
}

// Provide a safe default partial mock for rate-limit to ensure applyRateLimit exists in all tests
vi.mock('@/lib/rate-limit', async () => {
  try {
    const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
    return {
      ...actual,
      // Stable IP in tests
      getClientIp: vi.fn(() => '127.0.0.1'),
      // Async helpers default to allowed; individual tests can override
      rateLimitAsync: vi.fn(async () => true),
      applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 1, limit: 1, remaining: 0, resetAt: Date.now() + 1000 })),
    }
  } catch {
    return {
      getClientIp: vi.fn(() => '127.0.0.1'),
      rateLimit: vi.fn(() => true),
      rateLimitAsync: vi.fn(async () => true),
      applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 1, limit: 1, remaining: 0, resetAt: Date.now() + 1000 })),
    }
  }
})
