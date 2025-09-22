vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => null }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

// Minimal prisma mock for services list and get by id
const db: any = {
  services: [
    { id: 's1', slug: 'tax-filing', name: 'Tax Filing', description: 'Annual tax filing', shortDesc: 'Tax', features: [], price: 100, duration: 60, category: 'Tax', featured: false, active: true, image: null, tenantId: null, createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date('2024-01-02T00:00:00Z') },
  ],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findMany: vi.fn(async () => db.services),
      count: vi.fn(async () => db.services.length),
      findFirst: vi.fn(async ({ where }: any) => db.services.find((s: any) => s.id === where.id) || null),
    },
  },
}))

describe('ETag/304 for admin services', () => {
  it('GET list returns ETag and 304 on If-None-Match', async () => {
    const { GET }: any = await import('@/app/api/admin/services/route')
    const res1: any = await GET(new Request('https://x'))
    expect(res1.status).toBe(200)
    const etag = res1.headers.get('ETag')
    expect(etag).toBeTruthy()

    const res2: any = await GET(new Request('https://x', { headers: { 'If-None-Match': etag! } as any }))
    expect(res2.status).toBe(304)
    expect(res2.headers.get('ETag')).toBe(etag)
  })

  it('GET single returns ETag/Last-Modified and 304s correctly', async () => {
    const { GET }: any = await import('@/app/api/admin/services/[id]/route')
    const res1: any = await GET(new Request('https://x'), { params: Promise.resolve({ id: 's1' }) })
    expect(res1.status).toBe(200)
    const etag = res1.headers.get('ETag')
    const lastMod = res1.headers.get('Last-Modified')
    expect(etag).toBeTruthy()
    expect(lastMod).toBeTruthy()

    const res2: any = await GET(new Request('https://x', { headers: { 'If-None-Match': etag! } as any }), { params: Promise.resolve({ id: 's1' }) })
    expect(res2.status).toBe(304)
  })
})
