import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const calls: any = { findMany: [] as any[], count: [] as any[] }

const prismaMock = {
  serviceRequest: {
    findMany: vi.fn(async (args: any) => { calls.findMany.push(args); return [] }),
    count: vi.fn(async (args: any) => { calls.count.push(args); return 0 }),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

describe('admin/service-requests GET filters', () => {
  beforeEach(() => {
    calls.findMany = []
    calls.count = []
    prismaMock.serviceRequest.findMany.mockClear()
    prismaMock.serviceRequest.count.mockClear()
  })

  it('applies status, priority, bookingType, type=appointments, q, date range and orders by scheduledAt', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/route')
    const url = new URL('https://x')
    url.searchParams.set('status', 'IN_PROGRESS')
    url.searchParams.set('priority', 'HIGH')
    url.searchParams.set('bookingType', 'CONSULTATION')
    url.searchParams.set('type', 'appointments')
    url.searchParams.set('q', 'tax')
    url.searchParams.set('dateFrom', '2025-09-01')
    url.searchParams.set('dateTo', '2025-09-30')
    url.searchParams.set('page', '1')
    url.searchParams.set('limit', '10')

    const res: any = await GET(new Request(url.toString()))
    expect(res.status).toBe(200)

    expect(prismaMock.serviceRequest.findMany).toHaveBeenCalledTimes(1)
    const args = calls.findMany[0]
    expect(args).toBeTruthy()
    expect(args.orderBy).toEqual({ scheduledAt: 'desc' })
    expect(args.where.status).toBe('IN_PROGRESS')
    expect(args.where.priority).toBe('HIGH')
    expect(args.where.bookingType).toBe('CONSULTATION')
    expect(args.where.isBooking).toBe(true)
    expect(args.where.OR).toBeTruthy()
    expect(args.where.scheduledAt).toBeTruthy()
    expect(args.where.scheduledAt.gte).toBeInstanceOf(Date)
    expect(args.where.scheduledAt.lte).toBeInstanceOf(Date)
  })

  it('applies type=requests and orders by createdAt', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/route')
    const res: any = await GET(new Request('https://x?type=requests'))
    expect(res.status).toBe(200)

    const args = calls.findMany[0]
    expect(args.orderBy).toEqual({ createdAt: 'desc' })
    expect(args.where.OR).toBeTruthy()
    // requests branch sets OR on isBooking false/null
    const cond = args.where.OR
    expect(Array.isArray(cond)).toBe(true)
  })
})
