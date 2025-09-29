import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma for invoices
vi.mock('@/lib/prisma', () => ({
  default: {
    invoice: {
      findMany: vi.fn(async () => [
        { id: 'inv1', createdAt: new Date('2025-01-10'), updatedAt: new Date('2025-01-11'), paidAt: new Date('2025-01-12'), status: 'PAID', totalCents: 12345, currency: 'USD', number: 'INV-001', client: { name: 'Acme', email: 'a@acme.test' }, items: [] },
        { id: 'inv2', createdAt: new Date('2025-01-15'), updatedAt: new Date('2025-01-16'), paidAt: null, status: 'UNPAID', totalCents: 5000, currency: 'USD', number: 'INV-002', client: { name: 'Beta', email: 'b@beta.test' }, items: [] },
      ]),
      count: vi.fn(async () => 2),
      create: vi.fn(async () => ({ id: 'new', items: [] })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    booking: { findUnique: vi.fn(async () => null) },
  }
}))

// authOptions is imported by routes; getServerSession is globally mocked in vitest.setup.ts to ADMIN

describe('Admin Invoices API', () => {
  const prevDbUrl = process.env.NETLIFY_DATABASE_URL
  const prevDbUrl2 = process.env.DATABASE_URL

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NETLIFY_DATABASE_URL = 'postgres://test'
    process.env.DATABASE_URL = 'postgres://test'
  })
  afterEach(() => {
    process.env.NETLIFY_DATABASE_URL = prevDbUrl
    process.env.DATABASE_URL = prevDbUrl2
  })

  it('GET /api/admin/invoices returns paginated list', async () => {
    const { GET } = await import('@/app/api/admin/invoices/route')
    const req = new NextRequest('http://localhost/api/admin/invoices?status=PAID&page=1&limit=20&sortBy=createdAt&sortOrder=desc')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.invoices)).toBe(true)
    expect(body.total).toBe(2)
  })

  it('GET /api/admin/export?entity=invoices returns CSV', async () => {
    const { GET } = await import('@/app/api/admin/export/route')
    const req = new NextRequest('http://localhost/api/admin/export?entity=invoices&status=PAID')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text.includes('id,number,clientName,clientEmail,status,currency,total,createdAt,paidAt')).toBe(true)
    expect(text.includes('INV-001')).toBe(true)
  })
})
