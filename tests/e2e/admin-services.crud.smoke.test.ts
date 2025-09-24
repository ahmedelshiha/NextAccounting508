import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock auth and permissions
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => 't1' }))

// In-memory mock DB for services
const db: any = { services: [] as any[] }

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findMany: vi.fn(async ({ where = {}, skip = 0, take = 50, orderBy = { updatedAt: 'desc' } }: any) => {
        let items = db.services.slice()
        // Basic filters (featured/status/category/search)
        if (typeof where.featured === 'boolean') items = items.filter((s: any) => s.featured === where.featured)
        if (where.status?.not) items = items.filter((s: any) => s.status !== where.status.not)
        if (typeof where.status === 'string') items = items.filter((s: any) => s.status === where.status)
        if (where.category) items = items.filter((s: any) => s.category === where.category)
        if (where.OR) {
          items = items.filter((s: any) => where.OR.some((cond: any) => {
            if (cond.name?.contains) return (s.name || '').toLowerCase().includes(cond.name.contains.toLowerCase())
            if (cond.slug?.contains) return (s.slug || '').toLowerCase().includes(cond.slug.contains.toLowerCase())
            if (cond.shortDesc?.contains) return (s.shortDesc || '').toLowerCase().includes(cond.shortDesc.contains.toLowerCase())
            if (cond.description?.contains) return (s.description || '').toLowerCase().includes(cond.description.contains.toLowerCase())
            if (cond.category?.contains) return (s.category || '').toLowerCase().includes(cond.category.contains.toLowerCase())
            return false
          }))
        }
        // Sort
        const [[key, dir]] = Object.entries(orderBy as any)
        items.sort((a: any, b: any) => {
          const av = a[key]; const bv = b[key]
          if (av == null && bv == null) return 0
          if (av == null) return dir === 'asc' ? -1 : 1
          if (bv == null) return dir === 'asc' ? 1 : -1
          if (av < bv) return dir === 'asc' ? -1 : 1
          if (av > bv) return dir === 'asc' ? 1 : -1
          return 0
        })
        return items.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where = {} }: any) => {
        let items = db.services.slice()
        if (typeof where.featured === 'boolean') items = items.filter((s: any) => s.featured === where.featured)
        if (where.status?.not) items = items.filter((s: any) => s.status !== where.status.not)
        if (typeof where.status === 'string') items = items.filter((s: any) => s.status === where.status)
        if (where.category) items = items.filter((s: any) => s.category === where.category)
        if (where.OR) {
          items = items.filter((s: any) => where.OR.some((cond: any) => {
            if (cond.name?.contains) return (s.name || '').toLowerCase().includes(cond.name.contains.toLowerCase())
            if (cond.slug?.contains) return (s.slug || '').toLowerCase().includes(cond.slug.contains.toLowerCase())
            if (cond.shortDesc?.contains) return (s.shortDesc || '').toLowerCase().includes(cond.shortDesc.contains.toLowerCase())
            if (cond.description?.contains) return (s.description || '').toLowerCase().includes(cond.description.contains.toLowerCase())
            if (cond.category?.contains) return (s.category || '').toLowerCase().includes(cond.category.contains.toLowerCase())
            return false
          }))
        }
        return items.length
      }),
      findUnique: vi.fn(async ({ where: { id } }: any) => db.services.find((s: any) => s.id === id) || null),
      findFirst: vi.fn(async ({ where }: any) => db.services.find((s: any) => {
        if (where?.id?.in) return where.id.in.includes(s.id)
        if (where?.slug) return s.slug === where.slug
        if (where?.id) return s.id === where.id
        return true
      }) || null),
      create: vi.fn(async ({ data }: any) => {
        const id = 'svc' + (db.services.length + 1)
        const now = new Date().toISOString()
        const item = { id, createdAt: now, updatedAt: now, ...data }
        db.services.push(item)
        return item
      }),
      update: vi.fn(async ({ where: { id }, data }: any) => {
        const idx = db.services.findIndex((s: any) => s.id === id)
        if (idx === -1) throw new Error('not found')
        db.services[idx] = { ...db.services[idx], ...data, updatedAt: new Date().toISOString() }
        return db.services[idx]
      }),
      delete: vi.fn(async ({ where: { id } }: any) => {
        const before = db.services.length
        db.services = db.services.filter((s: any) => s.id !== id)
        return { count: before - db.services.length }
      }),
    },
    $queryRawUnsafe: vi.fn(async () => ([])),
  }
}))

// Routes under test

describe('E2E smoke — Admin services CRUD', () => {
  beforeEach(() => { db.services = [] })

  it('creates → updates → clones → lists with correct headers and pagination', async () => {
    const servicesRoute: any = await import('@/app/api/admin/services/route')
    const serviceItemRoute: any = await import('@/app/api/admin/services/[id]/route')
    const serviceCloneRoute: any = await import('@/app/api/admin/services/[id]/clone/route')

    // Create
    const createBody = {
      name: 'Tax Advisory',
      slug: 'tax-advisory',
      description: 'Comprehensive tax advisory and planning services',
      shortDesc: 'Tax planning',
      features: ['Consultation'],
      price: 250,
      duration: 60,
      category: 'Accounting',
      featured: false,
      active: true,
    }
    const createRes: any = await servicesRoute.POST(new Request('https://x', { method: 'POST', body: JSON.stringify(createBody) }))
    expect(createRes.status).toBe(201)
    const cjson = await createRes.json()
    expect(cjson.service?.id).toBeDefined()
    const id = cjson.service.id

    // Update
    const patchRes: any = await serviceItemRoute.PATCH(new Request('https://x', { method: 'PATCH', body: JSON.stringify({ price: 300 }) } as any), { params: { id } })
    expect(patchRes.status).toBe(200)
    const pjson = await patchRes.json()
    expect(pjson.service?.price).toBe(300)

    // Clone
    const cloneRes: any = await serviceCloneRoute.POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ name: 'Tax Advisory (Copy)' }) } as any), { params: { id } })
    expect(cloneRes.status).toBe(201)
    const cloneJson = await cloneRes.json()
    expect(cloneJson.service?.id).toBeDefined()
    expect(cloneJson.service?.name).toContain('Tax Advisory')

    // List with limit/offset and verify headers
    const listRes: any = await servicesRoute.GET(new Request('https://x?limit=50&offset=0&sortBy=updatedAt&sortOrder=desc'))
    expect(listRes.status).toBe(200)
    expect(listRes.headers.get('X-Total-Count')).toBe('2')
    const list = await listRes.json()
    expect(list.total).toBe(2)
    expect(Array.isArray(list.services)).toBe(true)
    expect(list.services.length).toBe(2)
  })
})
