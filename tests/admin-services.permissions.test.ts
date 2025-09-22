vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
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
    vi.doMock('@/lib/permissions', () => ({ hasPermission: () => false, PERMISSIONS: { SERVICES_MANAGE_FEATURED: 'services.manage.featured', SERVICES_CREATE: 'services.create', SERVICES_VIEW: 'services.view' } }))
    const { POST }: any = await import('@/app/api/admin/services/route')
    const req = new Request('https://x', { method: 'POST', body: JSON.stringify({ name: 'A', slug: 'a', description: 'd', features: [], featured: true, active: true }) })
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
