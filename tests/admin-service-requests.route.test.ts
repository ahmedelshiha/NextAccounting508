import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))
vi.mock('@/lib/realtime-enhanced', () => ({
  realtimeService: {
    emitServiceRequestUpdate: vi.fn(() => {}),
    broadcastToUser: vi.fn(() => {}),
  },
}))
vi.mock('@/lib/service-requests/assignment', () => ({ autoAssignServiceRequest: vi.fn(async () => {}) }))

const db: any = {
  items: [
    { id: 'sr1', clientId: 'c1', serviceId: 's1', title: 'T1', description: null, priority: 'MEDIUM', createdAt: new Date().toISOString() },
    { id: 'sr2', clientId: 'c2', serviceId: 's2', title: 'T2', description: null, priority: 'LOW', createdAt: new Date().toISOString() },
  ],
}

// Apply service-requests bootstrap
import setupServiceRequests from './setup/serviceRequests.setup'
setupServiceRequests()

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async ({ skip = 0, take = 10 }: any) => db.items.slice(skip, skip + take)),
      count: vi.fn(async () => db.items.length),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `sr${db.items.length + 1}`, ...data }
        db.items.unshift(created)
        return created
      }),
    },
  },
}))

describe('api/admin/service-requests route', () => {
  beforeEach(() => {
    db.items = [
      { id: 'sr1', clientId: 'c1', serviceId: 's1', title: 'T1', description: null, priority: 'MEDIUM', createdAt: new Date().toISOString() },
      { id: 'sr2', clientId: 'c2', serviceId: 's2', title: 'T2', description: null, priority: 'LOW', createdAt: new Date().toISOString() },
    ]
  })

  it('GET returns paginated list', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/route')
    const res: any = await GET(new Request('https://x?page=1&limit=1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBe(1)
    expect(json.pagination.total).toBe(2)
  })

  it('POST validates payload', async () => {
    const { POST }: any = await import('@/app/api/admin/service-requests/route')
    const bad: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({}) }))
    expect(bad.status).toBe(400)
    const badJson = await bad.json()
    expect(badJson.success).toBe(false)
  })

  it('POST creates a service request', async () => {
    const { POST }: any = await import('@/app/api/admin/service-requests/route')
    const payload = { clientId: 'c3', serviceId: 's3', title: 'New SR', priority: 'HIGH' }
    const ok: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(ok.status).toBe(201)
    const created = await ok.json()
    expect(created.success).toBe(true)
    expect(created.data.title).toBe('New SR')
  })
})
