import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'client1', name: 'Test Client' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))

const db: any = {
  request: { id: 'sr1', clientId: 'client1' },
  comments: [
    { id: 'c1', serviceRequestId: 'sr1', authorId: 'client1', content: 'Hi', createdAt: new Date().toISOString(), author: { id: 'client1', name: 'Test Client', email: 'client@example.com' } },
  ],
}

const prismaMock = {
  serviceRequest: {
    findUnique: vi.fn(async ({ where }: any) => (where.id === db.request.id ? { clientId: db.request.clientId } : null)),
  },
  serviceRequestComment: {
    findMany: vi.fn(async ({ where }: any) => db.comments.filter((c: any) => c.serviceRequestId === where.serviceRequestId)),
    create: vi.fn(async ({ data }: any) => {
      const created = {
        id: `c${db.comments.length + 1}`,
        serviceRequestId: data.serviceRequestId,
        authorId: data.authorId,
        content: data.content,
        createdAt: new Date().toISOString(),
        author: { id: 'client1', name: 'Test Client', email: 'client@example.com' },
      }
      db.comments.push(created)
      return created
    }),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

describe('api/portal/service-requests/[id]/comments route', () => {
  beforeEach(() => {
    db.comments = [
      { id: 'c1', serviceRequestId: 'sr1', authorId: 'client1', content: 'Hi', createdAt: new Date().toISOString(), author: { id: 'client1', name: 'Test Client', email: 'client@example.com' } },
    ]
  })

  it('GET returns comments for client-owned request', async () => {
    const { GET }: any = await import('@/app/api/portal/service-requests/[id]/comments/route')
    const res: any = await GET(new Request('https://x'), { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data[0]).toHaveProperty('author')
  })

  it('POST validates and creates comment', async () => {
    const { POST }: any = await import('@/app/api/portal/service-requests/[id]/comments/route')
    const bad: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ content: '' }) }), { params: Promise.resolve({ id: 'sr1' }) })
    expect(bad.status).toBe(400)

    const ok: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ content: 'New message' }) }), { params: Promise.resolve({ id: 'sr1' }) })
    expect(ok.status).toBe(201)
    const json = await ok.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('content', 'New message')
  })
})
