vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
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
vi.mock('@/lib/services/utils', () => ({
  validateSlugUniqueness: vi.fn(async () => {}),
  generateSlug: (n: string) => String(n).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, ''),
  sanitizeServiceData: (d: any) => d,
}))

// Apply services test bootstrap
import setupServices from './setup/services.setup'
setupServices()

// In-memory mock DB for services
const db: any = {
  services: [
    { id: 's1', slug: 'tax-filing', name: 'Tax Filing', description: 'Annual tax filing', shortDesc: 'Tax', features: [], price: 100, duration: 60, category: 'Tax', featured: false, active: true, image: null, tenantId: null, createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date('2024-01-02T00:00:00Z') },
    { id: 's2', slug: 'payroll', name: 'Payroll', description: 'Monthly payroll', shortDesc: 'Payroll', features: [], price: 200, duration: 45, category: 'HR', featured: true, active: true, image: null, tenantId: null, createdAt: new Date('2024-02-01T00:00:00Z'), updatedAt: new Date('2024-02-02T00:00:00Z') },
  ],
}

function matchWhere(s: any, where: any): boolean {
  if (!where) return true
  if (where.active !== undefined && s.active !== where.active) return false
  if (where.featured !== undefined && s.featured !== where.featured) return false
  if (where.category !== undefined && s.category !== where.category) return false
  if (where.id && where.id.in) { if (!where.id.in.includes(s.id)) return false }
  if (where.slug && s.slug !== where.slug) return false
  if (where.OR && Array.isArray(where.OR)) {
    const ok = where.OR.some((cond: any) => {
      if (cond.name?.contains) return s.name.toLowerCase().includes(String(cond.name.contains).toLowerCase())
      if (cond.slug?.contains) return s.slug.toLowerCase().includes(String(cond.slug.contains).toLowerCase())
      if (cond.shortDesc?.contains) return String(s.shortDesc || '').toLowerCase().includes(String(cond.shortDesc.contains).toLowerCase())
      if (cond.description?.contains) return String(s.description || '').toLowerCase().includes(String(cond.description.contains).toLowerCase())
      if (cond.category?.contains) return String(s.category || '').toLowerCase().includes(String(cond.category.contains).toLowerCase())
      return false
    })
    if (!ok) return false
  }
  return true
}

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findMany: vi.fn(async ({ where, orderBy, skip = 0, take = 20 }: any) => {
        let items = db.services.filter((s: any) => matchWhere(s, where))
        if (orderBy) {
          const [[key, dir]] = Object.entries(orderBy) as any
          items = items.sort((a: any, b: any) => {
            const av = a[key] instanceof Date ? a[key].getTime() : a[key]
            const bv = b[key] instanceof Date ? b[key].getTime() : b[key]
            if (av < bv) return dir === 'asc' ? -1 : 1
            if (av > bv) return dir === 'asc' ? 1 : -1
            return 0
          })
        }
        return items.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where }: any) => db.services.filter((s: any) => matchWhere(s, where)).length),
      findFirst: vi.fn(async ({ where }: any) => db.services.find((s: any) => matchWhere(s, where)) || null),
      create: vi.fn(async ({ data }: any) => {
        const id = 's' + (db.services.length + 1)
        const now = new Date()
        const item = { id, createdAt: now, updatedAt: now, active: true, featured: false, features: [], ...data }
        db.services.push(item)
        return item
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = db.services.findIndex((s: any) => s.id === where.id)
        if (idx === -1) return null
        db.services[idx] = { ...db.services[idx], ...data, updatedAt: new Date() }
        return db.services[idx]
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        db.services = db.services.map((s: any) => {
          if (matchWhere(s, where)) { count++; return { ...s, ...data, updatedAt: new Date() } }
          return s
        })
        return { count }
      }),
      groupBy: vi.fn(async ({ by, where }: any) => {
        if (!by.includes('category')) return []
        const categories = new Set(db.services.filter((s: any) => matchWhere(s, where) && s.category).map((s: any) => s.category))
        return Array.from(categories).map((c) => ({ category: c }))
      }),
      aggregate: vi.fn(async ({ where }: any) => {
        const items = db.services.filter((s: any) => matchWhere(s, where))
        const prices = items.map((s: any) => Number(s.price || 0)).filter((n: number) => isFinite(n))
        const sum = prices.reduce((a: number, n: number) => a + n, 0)
        const avg = prices.length ? sum / prices.length : 0
        return { _avg: { price: avg }, _sum: { price: sum } }
      }),
    },
  },
}))

describe('api/admin/services routes', () => {
  beforeEach(() => {
    db.services = [
      { id: 's1', slug: 'tax-filing', name: 'Tax Filing', description: 'Annual tax filing', shortDesc: 'Tax', features: [], price: 100, duration: 60, category: 'Tax', featured: false, active: true, image: null, tenantId: null, createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date('2024-01-02T00:00:00Z') },
      { id: 's2', slug: 'payroll', name: 'Payroll', description: 'Monthly payroll', shortDesc: 'Payroll', features: [], price: 200, duration: 45, category: 'HR', featured: true, active: true, image: null, tenantId: null, createdAt: new Date('2024-02-01T00:00:00Z'), updatedAt: new Date('2024-02-02T00:00:00Z') },
    ]
  })

  it('GET /api/admin/services returns list with counts and header', async () => {
    const { GET }: any = await import('@/app/api/admin/services/route')
    const res: any = await GET(new Request('https://x'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(2)
    expect(Array.isArray(json.services)).toBe(true)
    expect(res.headers.get('X-Total-Count')).toBe('2')
  })

  it('POST /api/admin/services creates a new service', async () => {
    const { POST }: any = await import('@/app/api/admin/services/route')
    const body = { name: 'Advisory', slug: 'advisory', description: 'Business advisory service', features: [], featured: false, active: true }
    const req = new Request('https://x', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.service?.id).toBeDefined()
    expect(json.service?.slug).toBe('advisory')
  })

  it('PATCH /api/admin/services/[id] updates a service', async () => {
    const { PATCH }: any = await import('@/app/api/admin/services/[id]/route')
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ name: 'Tax Filing Pro' }) })
    const res: any = await PATCH(req, { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.service?.name).toBe('Tax Filing Pro')
  })

  it('DELETE /api/admin/services/[id] soft-deletes (deactivates) a service', async () => {
    const { DELETE }: any = await import('@/app/api/admin/services/[id]/route')
    const res: any = await DELETE(new Request('https://x'), { params: Promise.resolve({ id: 's2' }) })
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.message).toBe('Service deleted successfully')
  })

  it('POST /api/admin/services/bulk performs bulk deactivation', async () => {
    const { POST }: any = await import('@/app/api/admin/services/bulk/route')
    const body = { action: 'deactivate', serviceIds: ['s1','s2'] }
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result?.updatedCount).toBe(2)
  })

  it('GET /api/admin/services/export returns CSV', async () => {
    const { GET }: any = await import('@/app/api/admin/services/export/route')
    const res: any = await GET(new Request('https://x?format=csv'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    const csv = await res.text()
    expect(csv.split('\n')[0]).toContain('ID,Name,Slug,Description')
  })

  it('GET /api/admin/services/stats returns aggregate stats', async () => {
    const { GET }: any = await import('@/app/api/admin/services/stats/route')
    const res: any = await GET(new Request('https://x'))
    expect(res.status).toBe(200)
    const stats = await res.json()
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.averagePrice).toBeGreaterThan(0)
  })
})
