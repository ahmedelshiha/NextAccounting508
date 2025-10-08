import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock prisma client used by route
vi.mock('@/lib/prisma', () => {
  const user = { upsert: vi.fn(async ({ where, update, create }) => ({ id: 'u1', email: create.email, name: create.name })) }
  const tenantMembership = { upsert: vi.fn(async () => ({ id: 'tm1' })) }
  return { default: { user, tenantMembership } }
})

// Mock tenant helpers
vi.mock('@/lib/tenant', async () => {
  const mod = await vi.importActual<any>('@/lib/tenant')
  return {
    ...mod,
    getResolvedTenantId: vi.fn(async () => 'tenant_test'),
    userByTenantEmail: (tenantId: string, email: string) => ({ tenantId_email: { tenantId, email } }),
  }
})

// Lazy import route after mocks
const modPromise = import('@/app/api/auth/register/route')

function mkReq(body: any) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('/api/auth/register', () => {
  const prevDb = process.env.DATABASE_URL
  const prevNf = process.env.NETLIFY_DATABASE_URL

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test'
    process.env.NETLIFY_DATABASE_URL = ''
  })

  afterEach(() => {
    process.env.DATABASE_URL = prevDb
    process.env.NETLIFY_DATABASE_URL = prevNf
  })

  it('rejects invalid input', async () => {
    const { POST } = await modPromise
    const res = await POST(mkReq({ email: 'x@example.com', password: '123' }))
    expect(res.status).toBe(400)
  })

  it('creates user and membership', async () => {
    const { POST } = await modPromise
    const res = await POST(mkReq({ name: 'Test', email: 'x@example.com', password: '123456' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.email).toBe('x@example.com')
  })
})
