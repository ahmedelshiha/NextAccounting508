import { vi, describe, it, expect, beforeEach } from 'vitest'

// Auth/permissions
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

// In-memory stores
const db: any = { bookings: [] as any[], services: [{ id: 's1', name: 'Tax Filing', price: 150 }] }

vi.mock('@/lib/prisma', () => ({
  default: {
    booking: {
      findFirst: vi.fn(async ({ where = {} }: any) => {
        // return first matching booking or null
        let items = db.bookings.slice()
        if (where.status) {
          if (Array.isArray(where.status.in)) items = items.filter((b: any) => where.status.in.includes(b.status))
          else items = items.filter((b: any) => b.status === where.status)
        }
        if (where.scheduledAt?.gte) items = items.filter((b: any) => new Date(b.scheduledAt) >= new Date(where.scheduledAt.gte))
        if (where.scheduledAt?.lte) items = items.filter((b: any) => new Date(b.scheduledAt) <= new Date(where.scheduledAt.lte))
        if (items.length === 0) return null
        return items[0]
      }),
      findMany: vi.fn(async ({ where = {}, select, include }: any) => {
        let items = db.bookings.slice()
        if (where.status) {
          if (Array.isArray(where.status.in)) items = items.filter((b: any) => where.status.in.includes(b.status))
          else items = items.filter((b: any) => b.status === where.status)
        }
        if (where.createdAt?.gte) items = items.filter((b: any) => new Date(b.createdAt) >= new Date(where.createdAt.gte))
        if (where.createdAt?.lt) items = items.filter((b: any) => new Date(b.createdAt) < new Date(where.createdAt.lt))
        if (where.scheduledAt?.gte) items = items.filter((b: any) => new Date(b.scheduledAt) >= new Date(where.scheduledAt.gte))
        if (where.scheduledAt?.lte) items = items.filter((b: any) => new Date(b.scheduledAt) <= new Date(where.scheduledAt.lte))
        // include service with price when requested
        if (include?.service?.select?.price) {
          return items.map((b: any) => ({ ...b, service: db.services.find((s: any) => s.id === b.serviceId) || null }))
        }
        if (select) return items.map((b: any) => ({ id: b.id, scheduledAt: b.scheduledAt, serviceId: b.serviceId, service: { id: b.serviceId, name: 'Tax Filing', price: 150 } }))
        return items
      }),
      count: vi.fn(async ({ where = {} }: any) => {
        let items = db.bookings.slice()
        if (where.status) items = items.filter((b: any) => b.status === where.status)
        if (where.scheduledAt?.gte) items = items.filter((b: any) => new Date(b.scheduledAt) >= new Date(where.scheduledAt.gte))
        if (where.scheduledAt?.lt) items = items.filter((b: any) => new Date(b.scheduledAt) < new Date(where.scheduledAt.lt))
        if (where.createdAt?.gte) items = items.filter((b: any) => new Date(b.createdAt) >= new Date(where.createdAt.gte))
        if (where.createdAt?.lte) items = items.filter((b: any) => new Date(b.createdAt) <= new Date(where.createdAt.lte))
        return items.length
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = 'bk' + (db.bookings.length + 1)
        const now = new Date().toISOString()
        const item = { id, createdAt: now, ...data }
        db.bookings.push(item)
        return { ...item, service: db.services.find((s: any) => s.id === data.serviceId) || null }
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        db.bookings = db.bookings.map((b: any) => {
          if (where.id?.in?.includes(b.id)) { count++; return { ...b, ...data } }
          return b
        })
        return { count }
      }),
    },
    service: {
      findUnique: vi.fn(async ({ where }: any) => db.services.find((s: any) => s.id === where.id) || null),
    }
  }
}))

describe('E2E — bookings totals consistent with stats', () => {
  beforeEach(() => { db.bookings = [] })

  it('POST create → PATCH complete → stats reflect totals', async () => {
    const bookingsMod: any = await import('@/app/api/admin/bookings/route')
    const statsMod: any = await import('@/app/api/admin/stats/bookings/route')

    // Create confirmed booking
    const scheduledAt = new Date(Date.now() + 60_000).toISOString()
    const payload = { serviceId: 's1', scheduledAt, duration: 60, clientName: 'Acme Co', clientEmail: 'acme@example.com' }
    const createRes: any = await bookingsMod.POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    const id = created.booking.id

    // Complete via bulk PATCH action
    const patchRes: any = await bookingsMod.PATCH(new Request('https://x', { method: 'PATCH', body: JSON.stringify({ bookingIds: [id], action: 'complete' }) }))
    expect(patchRes.status).toBe(200)

    // Stats
    const statsRes: any = await statsMod.GET(new Request('https://x'))
    expect(statsRes.status).toBe(200)
    const stats = await statsRes.json()
    expect(stats.total).toBe(1)
    expect(stats.completed).toBe(1)
    expect(typeof stats.revenue.total).toBe('number')
  })
})
