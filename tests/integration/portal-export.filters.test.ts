import { describe, it, expect, beforeEach, vi } from 'vitest'

function mockSession(id = 'client1') {
  vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id } })) }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
}

const items = [
  { id: 'sr1', title: 'VAT Return Q1', priority: 'MEDIUM', status: 'SUBMITTED', createdAt: new Date('2024-01-05T12:00:00Z'), scheduledAt: null, bookingType: '', service: { name: 'Tax Filing' }, clientId: 'client1', tenantId: 't1' },
  { id: 'sr2', title: 'Payroll Feb', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: new Date('2024-02-01T09:00:00Z'), scheduledAt: new Date('2024-02-20T00:00:00Z'), bookingType: 'FOLLOW_UP', service: { name: 'Payroll' }, clientId: 'client1', tenantId: 't1' },
  { id: 'sr3', title: 'Other client item', priority: 'LOW', status: 'SUBMITTED', createdAt: new Date('2024-03-01T00:00:00Z'), scheduledAt: null, bookingType: '', service: { name: 'Advisory' }, clientId: 'other', tenantId: 't1' },
]

function matchWhere(where: any, row: any) {
  if (where.clientId && row.clientId !== where.clientId) return false
  if (where.status && row.status !== where.status) return false
  if (where.priority && row.priority !== where.priority) return false
  if (where.bookingType && row.bookingType !== where.bookingType) return false
  if (where.OR && Array.isArray(where.OR)) {
    const ok = where.OR.some((cond: any) => {
      if (cond.title?.contains) return String(row.title).toLowerCase().includes(String(cond.title.contains).toLowerCase())
      if (cond.description?.contains) return String(row.description || '').toLowerCase().includes(String(cond.description.contains).toLowerCase())
      return false
    })
    if (!ok) return false
  }
  if (where.scheduledAt?.gte && (!row.scheduledAt || new Date(row.scheduledAt).getTime() < new Date(where.scheduledAt.gte).getTime())) return false
  if (where.scheduledAt?.lte && (!row.scheduledAt || new Date(row.scheduledAt).getTime() > new Date(where.scheduledAt.lte).getTime())) return false
  if (where.createdAt?.gte && new Date(row.createdAt).getTime() < new Date(where.createdAt.gte).getTime()) return false
  if (where.createdAt?.lte && new Date(row.createdAt).getTime() > new Date(where.createdAt.lte).getTime()) return false
  return true
}

const prismaMock: any = {
  serviceRequest: {
    findMany: vi.fn(async ({ where }: any) => items.filter((r) => matchWhere(where, r))),
  },
}

function mockPrisma() {
  vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
}

describe('Portal export filters', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('filters by status and q; excludes other clients; returns CSV with one matching row', async () => {
    mockSession('client1')
    mockPrisma()

    const { GET }: any = await import('@/app/api/portal/service-requests/export/route')
    const url = 'https://app.example.com/api/portal/service-requests/export?status=SUBMITTED&q=vat'
    const res: Response = await GET(new Request(url) as any)
    expect(res.status).toBe(200)
    const text = await res.text()
    const lines = text.trim().split(/\n/)
    expect(lines[0]).toMatch(/id,.*title,.*service,.*priority,.*status,.*createdAt,.*scheduledAt,.*bookingType/i)
    expect(lines.length).toBe(2) // header + 1 row
    expect(text).toMatch(/VAT Return Q1/)
    expect(text).not.toMatch(/Payroll Feb/)
  })

  it('type=appointments uses scheduledAt window and includes scheduledAt in CSV', async () => {
    mockSession('client1')
    mockPrisma()

    const { GET }: any = await import('@/app/api/portal/service-requests/export/route')
    const url = 'https://app.example.com/api/portal/service-requests/export?type=appointments&dateFrom=2024-02-01&dateTo=2024-02-28'
    const res: Response = await GET(new Request(url) as any)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toMatch(/Payroll Feb/)
    // Should not include the item without scheduledAt (appointments mode filters by scheduledAt)
    expect(text).not.toMatch(/VAT Return Q1/)
  })
})
