import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock auth and permissions
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

// In-memory mock DB for bookings
const db: any = { bookings: [] as any[] }

vi.mock('@/lib/prisma', () => ({
  default: {
    booking: {
      findMany: vi.fn(async ({ where = {}, skip = 0, take = 50 }: any) => {
        let items = db.bookings.slice()
        if (where.status) items = items.filter((b: any) => b.status === where.status)
        if (where.OR) {
          items = items.filter((b: any) => where.OR.some((cond: any) => {
            if (cond.clientName?.contains) return (b.clientName || '').toLowerCase().includes(cond.clientName.contains.toLowerCase())
            if (cond.clientEmail?.contains) return (b.clientEmail || '').toLowerCase().includes(cond.clientEmail.contains.toLowerCase())
            if (cond.service?.name?.contains) return (b.service?.name || '').toLowerCase().includes(cond.service.name.contains.toLowerCase())
            return false
          }))
        }
        if (where.scheduledAt?.gte) items = items.filter((b: any) => new Date(b.scheduledAt) >= new Date(where.scheduledAt.gte))
        if (where.scheduledAt?.lte) items = items.filter((b: any) => new Date(b.scheduledAt) <= new Date(where.scheduledAt.lte))
        return items.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where = {} }: any) => {
        let items = db.bookings.slice()
        if (where.status) items = items.filter((b: any) => b.status === where.status)
        return items.length
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return db.bookings.find((b: any) => {
          const at = new Date(b.scheduledAt).getTime()
          const want = new Date(where.scheduledAt).getTime()
          const inStatuses = where.status?.in ? where.status.in.includes(b.status) : true
          return at === want && inStatuses
        }) || null
      }),
      create: vi.fn(async ({ data, include }: any) => {
        const id = 'bk' + (db.bookings.length + 1)
        const item = { id, ...data }
        db.bookings.push(item)
        const withIncludes = { ...item, client: data.clientId ? { id: data.clientId, name: data.clientName || '', email: data.clientEmail || '', _count: { bookings: 1 } } : null, service: data.serviceId ? { id: data.serviceId, name: 'Service', price: 100 } : null }
        return withIncludes
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        db.bookings = db.bookings.map((b: any) => {
          if (where.id?.in?.includes(b.id)) { count++; return { ...b, ...data } }
          return b
        })
        return { count }
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const before = db.bookings.length
        db.bookings = db.bookings.filter((b: any) => !where.id.in.includes(b.id))
        return { count: before - db.bookings.length }
      })
    }
  }
}))

// Route under test

describe('E2E smoke — Admin bookings create → list', () => {
  beforeEach(() => { db.bookings = [] })

  it('creates a booking via POST then lists it via GET', async () => {
    const { POST, GET }: any = await import('@/app/api/admin/bookings/route')

    const scheduledAt = new Date(Date.now() + 60_000).toISOString()
    const payload = { serviceId: 's1', scheduledAt, duration: 60, clientName: 'Acme Co', clientEmail: 'acme@example.com' }

    const createRes: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    expect(created.booking?.id).toBeDefined()
    expect(created.booking?.clientEmail).toBe('acme@example.com')

    const listRes: any = await GET(new Request('https://x?limit=50'))
    expect(listRes.status).toBe(200)
    const list = await listRes.json()
    expect(list.total).toBe(1)
    expect(Array.isArray(list.bookings)).toBe(true)
    expect(list.bookings[0].clientEmail).toBe('acme@example.com')
  })
})
