import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => 't1', tenantFilter: () => ({ tenantId: 't1' }) }))

// Apply service-requests bootstrap
import setupServiceRequests from '../setup/serviceRequests.setup'
setupServiceRequests()

const db: any = { srs: [] as any[] }

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async ({ where = {}, skip = 0, take = 10, orderBy = { createdAt: 'desc' } }: any) => {
        let items = db.srs.slice()
        if (where.status) items = items.filter((r: any) => r.status === where.status)
        if (where.priority) items = items.filter((r: any) => r.priority === where.priority)
        if (where.clientId) items = items.filter((r: any) => r.clientId === where.clientId)
        if (where.serviceId) items = items.filter((r: any) => r.serviceId === where.serviceId)
        if (where.OR) items = items.filter((r: any) => where.OR.some((cond: any) => (r.title || '').toLowerCase().includes(cond.title?.contains?.toLowerCase() || '') || (r.description || '').toLowerCase().includes(cond.description?.contains?.toLowerCase() || '')))
        const [field, dir] = (() => {
          const key = orderBy && typeof orderBy === 'object' ? Object.keys(orderBy)[0] : 'createdAt'
          const direction = (orderBy as any)?.[key] === 'asc' ? 'asc' : 'desc'
          return [key, direction] as const
        })()
        items.sort((a: any, b: any) => {
          const av = a[field] ?? a.createdAt
          const bv = b[field] ?? b.createdAt
          const cmp = field === 'status' || field === 'priority'
            ? String(av).localeCompare(String(bv))
            : new Date(av).getTime() - new Date(bv).getTime()
          return dir === 'asc' ? cmp : -cmp
        })
        return items.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where = {} }: any) => {
        let items = db.srs.slice()
        if (where.status) items = items.filter((r: any) => r.status === where.status)
        return items.length
      }),
    },
  }
}))

describe('API contract — /api/admin/service-requests GET', () => {
  beforeEach(() => {
    db.srs = [
      { id: 'r1', title: 'A', description: 'a', status: 'OPEN', createdAt: new Date('2025-01-01').toISOString(), clientId: 'c1' },
      { id: 'r2', title: 'B', description: 'b', status: 'OPEN', createdAt: new Date('2025-02-01').toISOString(), clientId: 'c2' },
      { id: 'r3', title: 'C', description: 'c', status: 'CLOSED', createdAt: new Date('2025-03-01').toISOString(), clientId: 'c3' },
    ]
  })

  it('returns success body, pagination meta and X-Total-Count header', async () => {
    const mod: any = await import('@/app/api/admin/service-requests/route')
    const res: any = await mod.GET(new Request('https://x?page=1&limit=2&status=OPEN'))
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Total-Count')).toBe('2')
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBe(2)
    expect(json.pagination.total).toBe(2)
    expect(json.pagination.limit).toBe(2)
    expect(json.pagination.page).toBe(1)
    expect(json.pagination.totalPages).toBe(1)
  })

  it('supports limit+offset and sortBy/sortOrder', async () => {
    const mod: any = await import('@/app/api/admin/service-requests/route')
    const resAsc: any = await mod.GET(new Request('https://x?limit=3&offset=0&sortBy=createdAt&sortOrder=asc'))
    const a = await resAsc.json()
    expect(a.data[0].id).toBe('r1')
    const resOffset: any = await mod.GET(new Request('https://x?limit=1&offset=2&sortBy=createdAt&sortOrder=asc'))
    const o = await resOffset.json()
    expect(o.data[0].id).toBe('r3')
  })
})
