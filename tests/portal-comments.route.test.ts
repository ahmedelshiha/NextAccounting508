import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock next-auth/next for App Router
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => ({ 
    user: { 
      id: 'client1', 
      name: 'Test Client',
      role: 'CLIENT',
      tenantId: 'test-tenant',
      tenantRole: 'CLIENT'
    } 
  })),
}))
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ 
    user: { 
      id: 'client1', 
      name: 'Test Client',
      role: 'CLIENT',
      tenantId: 'test-tenant',
      tenantRole: 'CLIENT'
    } 
  })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
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
        attachments: data.attachments || [],
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

  it('POST accepts attachments metadata', async () => {
    const { POST }: any = await import('@/app/api/portal/service-requests/[id]/comments/route')
    const payload = { content: 'With file', attachments: [{ name: 'doc.pdf', size: 1234, type: 'application/pdf', url: 'https://example.com/doc.pdf' }] }
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }), { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.attachments)).toBe(true)
    expect(json.data.attachments[0].name).toBe('doc.pdf')
  })
})
