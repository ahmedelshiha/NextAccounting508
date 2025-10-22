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
      role: 'CLIENT',
      tenantId: 'test-tenant'
    } 
  })) 
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
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => null, tenantFilter: () => ({}) }))

// Apply service-requests bootstrap
import setupServiceRequests from './setup/serviceRequests.setup'
setupServiceRequests()

const calls: any[] = []

const mkItem = (id: string, createdAt: string, scheduledAt?: string) => ({
  id,
  title: `R ${id}`,
  service: { name: 'Service' },
  priority: 'MEDIUM',
  status: 'SUBMITTED',
  createdAt: new Date(createdAt),
  ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
})

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async (args: any) => {
        calls.push(args)
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

describe('portal service-requests export', () => {
  beforeEach(() => { calls.length = 0 })

  it('orders by scheduledAt for appointments and includes booking columns', async () => {
    const { GET }: any = await import('@/app/api/portal/service-requests/export/route')
    const url = new URL('https://x')
    url.searchParams.set('type', 'appointments')
    const res: any = await GET(new Request(url.toString()))
    expect(res.status).toBe(200)
    const text = await res.text()
    const [header, ...rows] = text.trim().split('\n')
    expect(header.replace(/"/g,'')).toBe('id,title,service,priority,status,createdAt,scheduledAt,bookingType')
    expect(rows.length).toBeGreaterThan(0)
    const firstCall = calls.find(c => c.orderBy)
    expect(firstCall?.orderBy).toEqual({ scheduledAt: 'desc' })
  })

  it('orders by createdAt when type not appointments', async () => {
    const { GET }: any = await import('@/app/api/portal/service-requests/export/route')
    const res: any = await GET(new Request('https://x'))
    expect(res.status).toBe(200)
    await res.text()
    const firstCall = calls.find(c => c.orderBy)
    expect(firstCall?.orderBy).toEqual({ createdAt: 'desc' })
  })
})
