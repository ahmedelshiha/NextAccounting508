import { vi, describe, it, expect } from 'vitest'

// Mock next-auth/next for App Router
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => ({ 
    user: { 
      id: 'admin1',
      name: 'Test Admin',
      role: 'ADMIN',
      tenantId: 'test-tenant',
      tenantRole: 'ADMIN'
    } 
  })),
}))
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ 
    user: { 
      id: 'admin1',
      role: 'ADMIN',
      tenantId: 'test-tenant'
    } 
  })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
  return {
    ...actual,
    getClientIp: vi.fn(() => '127.0.0.1'),
    rateLimit: vi.fn(() => true),
    rateLimitAsync: vi.fn(async () => true),
    applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 1, limit: 1, remaining: 0, resetAt: Date.now() + 1000 })),
  }
})
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => null }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

// Mock prisma minimal
vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findFirst: vi.fn(async () => ({ id: 's1', slug: 'x', name: 'x', description: 'd', shortDesc: '', features: [], price: 10, duration: 60, category: null, featured: false, active: true, image: null, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn(async ({ data }: any) => ({ id: 's1', slug: 'x', name: data.name || 'x', featured: data.featured ?? false, active: true, status: 'ACTIVE', updatedAt: new Date(), createdAt: new Date() })),
      create: vi.fn(async ({ data }: any) => ({ id: 's2', ...data, createdAt: new Date(), updatedAt: new Date() })),
      count: vi.fn(async () => 1), findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []), aggregate: vi.fn(async () => ({ _avg: { price: 0 }, _sum: { price: 0 } })),
    },
    booking: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
  },
}))

describe('Permissions for featured field', () => {
  it('POST blocks setting featured without SERVICES_MANAGE_FEATURED', async () => {
    // Mock permissions to allow creation but not featured management
    vi.doMock('@/lib/permissions', () => ({ 
      hasPermission: (role: any, p: string) => {
        // Allow SERVICES_CREATE but not SERVICES_MANAGE_FEATURED
        return p === 'services.create'
      },
      PERMISSIONS: { 
        SERVICES_MANAGE_FEATURED: 'services.manage.featured', 
        SERVICES_CREATE: 'services.create', 
        SERVICES_VIEW: 'services.view' 
      } 
    }))
    const { POST }: any = await import('@/app/api/admin/services/route')
    const req = new Request('https://x', { 
      method: 'POST', 
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        name: 'Test Service', 
        slug: 'test-service', 
        description: 'Test Description', 
        features: [], 
        featured: true, 
        active: true,
        price: 100,
        duration: 60,
        shortDesc: 'Short description'
      }) 
    })
    const res: any = await POST(req)
    expect(res.status).toBe(403)
  })

  it('PATCH blocks changing featured without permission', async () => {
    vi.doMock('@/lib/permissions', () => ({ hasPermission: (role: any, p: string) => p !== 'services.manage.featured', PERMISSIONS: { SERVICES_MANAGE_FEATURED: 'services.manage.featured', SERVICES_EDIT: 'services.edit', SERVICES_VIEW: 'services.view' } }))
    const { PATCH }: any = await import('@/app/api/admin/services/[id]/route')
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ featured: true }) })
    const res: any = await PATCH(req, { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(403)
  })
})
