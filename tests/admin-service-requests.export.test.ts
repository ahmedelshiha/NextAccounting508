import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => null, tenantFilter: () => ({}) }))

const calls: any[] = []

const mkItem = (id: string, createdAt: string, scheduledAt?: string) => ({
  id,
  uuid: `${id}-uuid`,
  title: `Title ${id}`,
  status: 'SUBMITTED',
  priority: 'MEDIUM',
  client: { id: 'c1', name: 'Client 1', email: 'c1@example.com' },
  service: { id: 's1', name: 'Service 1', slug: 'service-1' },
  assignedTeamMember: { id: 't1', name: 'Team One', email: 't1@example.com' },
  budgetMin: 100,
  budgetMax: 200,
  deadline: null as any,
  createdAt: new Date(createdAt),
  scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
})

// Apply service-requests bootstrap
import setupServiceRequests from './setup/serviceRequests.setup'
setupServiceRequests()

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async (args: any) => {
        calls.push(args)
        // Return two rows for simplicity
        const now = '2025-01-02T12:00:00.000Z'
        if (args.orderBy?.scheduledAt) {
          return [
            mkItem('sr2', '2025-01-01T10:00:00.000Z', '2025-01-02T10:00:00.000Z'),
            mkItem('sr1', '2025-01-01T09:00:00.000Z', '2025-01-02T09:00:00.000Z'),
          ]
        }
        return [
          mkItem('sr2', '2025-01-01T10:00:00.000Z'),
          mkItem('sr1', '2025-01-01T09:00:00.000Z'),
        ]
      }),
    },
  },
}))

describe('admin service-requests export', () => {
  beforeEach(() => { calls.length = 0 })

  it('orders by scheduledAt for appointments and includes booking headers', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/export/route')
    const url = new URL('https://x')
    url.searchParams.set('type', 'appointments')
    url.searchParams.set('dateFrom', '2025-01-01')
    url.searchParams.set('dateTo', '2025-01-31')
    const res: any = await GET(new Request(url.toString()))
    expect(res.status).toBe(200)
    const text = await res.text()
    const [header, ...rows] = text.trim().split('\n')
    expect(header.split(',')).toEqual([
      'id','uuid','title','status','priority','clientName','clientEmail','serviceName','assignedTo','budgetMin','budgetMax','deadline','createdAt','scheduledAt','isBooking','bookingType'
    ])
    expect(rows.length).toBeGreaterThan(0)
    // Verify prisma called with scheduledAt ordering
    const firstCall = calls.find(c => c.orderBy)
    expect(firstCall?.orderBy).toEqual({ scheduledAt: 'desc' })
  })

  it('orders by createdAt for non-appointments', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/export/route')
    const url = new URL('https://x')
    const res: any = await GET(new Request(url.toString()))
    expect(res.status).toBe(200)
    await res.text()
    const firstCall = calls.find(c => c.orderBy)
    expect(firstCall?.orderBy).toEqual({ createdAt: 'desc' })
  })
})
