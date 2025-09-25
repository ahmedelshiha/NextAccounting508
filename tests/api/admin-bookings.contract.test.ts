import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: { TEAM_MANAGE: 'TEAM_MANAGE' } }))

const db: any = { bookings: [] as any[] }

vi.mock('@/lib/prisma', () => ({
  default: {
    booking: {
      findMany: vi.fn(async ({ where = {}, skip = 0, take = 10, orderBy = { scheduledAt: 'desc' } }: any) => {
        let items = db.bookings.slice()
        if (where.status) items = items.filter((b: any) => b.status === where.status)
        const [field, dir] = (() => {
          const key = orderBy && typeof orderBy === 'object' ? Object.keys(orderBy)[0] : 'scheduledAt'
          const direction = (orderBy as any)?.[key] === 'asc' ? 'asc' : 'desc'
          return [key, direction] as const
        })()
        items.sort((a: any, b: any) => {
          const av = a[field] ?? a.scheduledAt
          const bv = b[field] ?? b.scheduledAt
          const cmp = field === 'status'
            ? String(av).localeCompare(String(bv))
            : new Date(av).getTime() - new Date(bv).getTime()
          return dir === 'asc' ? cmp : -cmp
        })
        return items.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where = {} }: any) => {
        let items = db.bookings.slice()
        if (where.status) items = items.filter((b: any) => b.status === where.status)
        return items.length
      }),
    }
  }
}))

describe('API contract — /api/admin/bookings GET', () => {
  beforeEach(() => {
    db.bookings = [
      { id: 'b1', scheduledAt: new Date('2025-01-01').toISOString(), status: 'CONFIRMED' },
      { id: 'b2', scheduledAt: new Date('2025-02-01').toISOString(), status: 'CONFIRMED' },
    ]
  })

  it('supports limit+offset and returns X-Total-Count header', async () => {
    const mod: any = await import('@/app/api/admin/bookings/route')
    const res1: any = await mod.GET(new Request('https://x?limit=1&offset=0'))
    expect(res1.status).toBe(200)
    expect(res1.headers.get('X-Total-Count')).toBe('2')
    const j1 = await res1.json()
    expect(j1.bookings.length).toBe(1)
    expect(j1.page).toBe(1)

    const res2: any = await mod.GET(new Request('https://x?limit=1&offset=1'))
    const j2 = await res2.json()
    expect(j2.bookings.length).toBe(1)
    expect(j2.page).toBe(2)
  })

  it('supports sortBy and sortOrder', async () => {
    const mod: any = await import('@/app/api/admin/bookings/route')
    const resAsc: any = await mod.GET(new Request('https://x?limit=2&offset=0&sortBy=scheduledAt&sortOrder=asc'))
    const a = await resAsc.json()
    expect(a.bookings[0].id).toBe('b1')
    const resDesc: any = await mod.GET(new Request('https://x?limit=2&offset=0&sortBy=scheduledAt&sortOrder=desc'))
    const d = await resDesc.json()
    expect(d.bookings[0].id).toBe('b2')
  })
})
