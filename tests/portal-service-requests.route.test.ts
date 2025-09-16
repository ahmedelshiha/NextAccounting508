import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'client1' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))

const db: any = {
  items: [
    { id: 'sr1', clientId: 'client1', serviceId: 'svc1', title: 'My request', description: null, priority: 'MEDIUM', createdAt: new Date().toISOString() },
  ],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, active: true })),
    },
    serviceRequest: {
      findMany: vi.fn(async ({ where, skip = 0, take = 10 }: any) => db.items.filter((x: any) => x.clientId === where.clientId).slice(skip, skip + take)),
      count: vi.fn(async ({ where }: any) => db.items.filter((x: any) => x.clientId === where.clientId).length),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `sr${db.items.length + 1}`, ...data }
        db.items.unshift(created)
        return created
      }),
    },
  },
}))

describe('api/portal/service-requests route', () => {
  beforeEach(() => {
    db.items = [
      { id: 'sr1', clientId: 'client1', serviceId: 'svc1', title: 'My request', description: null, priority: 'MEDIUM', createdAt: new Date().toISOString() },
    ]
  })

  it('GET returns only client-owned requests', async () => {
    const { GET }: any = await import('@/app/api/portal/service-requests/route')
    const res: any = await GET(new Request('https://x?page=1&limit=10'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data[0].clientId).toBe('client1')
  })

  it('POST validates and creates request for current user', async () => {
    const { POST }: any = await import('@/app/api/portal/service-requests/route')
    const bad: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({}) }))
    expect(bad.status).toBe(400)

    const ok: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ serviceId: 'svc2', title: 'Need help', priority: 'low' }) }))
    expect(ok.status).toBe(201)
    const created = await ok.json()
    expect(created.success).toBe(true)
    expect(created.data.clientId).toBe('client1')
    expect(created.data.priority).toBe('low'.toUpperCase())
  })
})
