import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing ServicesService
const mockPrisma = vi.hoisted(() => ({
  service: {
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  booking: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  serviceView: {
    groupBy: vi.fn(),
  }
})) as any

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))

import ServicesService from '@/services/services.service'
import { CacheService } from '@/lib/cache.service'
import { NotificationService } from '@/lib/notification.service'

// Use actual implementation (not default export proxy) - ServicesService exports class default? It's named export; import above may need adjustment
// The project exports class ServicesService as named export; adjust import
import { ServicesService as SS } from '@/services/services.service'

describe('ServicesService analytics and bulk operations', () => {
  let svc: SS
  beforeEach(() => {
    vi.resetAllMocks()
    svc = new SS(new CacheService(), new NotificationService())
  })

  it('computes revenueTimeSeries and conversionsByService from bookings and serviceViews', async () => {
    // Arrange: create two services and bookings over 2 months
    const tenantId = 't1'

    // mock counts and aggregates
    mockPrisma.service.count.mockResolvedValue(2)
    mockPrisma.service.groupBy.mockResolvedValue([{ category: 'Accounting' }])
    mockPrisma.service.aggregate.mockResolvedValue({ _avg: { price: 100 }, _sum: { price: 200 } })

    // bookings: two bookings for service s1 in month1 and month2, one for s2
    const now = new Date()
    const m1 = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const m2 = new Date(now.getFullYear(), now.getMonth(), 1)

    const bookings = [
      { id: 'b1', scheduledAt: m1.toISOString(), serviceId: 's1', service: { id: 's1', name: 'Service 1', price: 100 } },
      { id: 'b2', scheduledAt: m2.toISOString(), serviceId: 's1', service: { id: 's1', name: 'Service 1', price: 100 } },
      { id: 'b3', scheduledAt: m2.toISOString(), serviceId: 's2', service: { id: 's2', name: 'Service 2', price: 100 } },
    ]

    mockPrisma.booking.findMany.mockResolvedValue(bookings)

    // serviceView groupBy
    mockPrisma.serviceView.groupBy.mockResolvedValue([
      { serviceId: 's1', _count: { _all: 10 } },
      { serviceId: 's2', _count: { _all: 5 } },
    ])

    // service findMany
    mockPrisma.service.findMany.mockResolvedValue([{ id: 's1', name: 'Service 1' }, { id: 's2', name: 'Service 2' }])

    // Act
    const res = await svc.getServiceStats(tenantId, '30d')

    // Assert basic structure
    expect(res.analytics).toBeDefined()
    const analytics: any = res.analytics
    expect(Array.isArray(analytics.revenueByService)).toBe(true)
    expect(Array.isArray(analytics.revenueTimeSeries)).toBe(true)
    expect(Array.isArray(analytics.conversionsByService)).toBe(true)

    // revenueByService should include Service 1 and 2
    const names = analytics.revenueByService.map((r: any) => r.service)
    expect(names).toEqual(expect.arrayContaining(['Service 1','Service 2']))

    // conversions should include conversionRates computed from mocked counts
    const conv = analytics.conversionsByService.find((c: any) => c.service === 'Service 1')
    expect(conv).toBeDefined()
    expect(conv.views).toBe(10)
    expect(conv.bookings).toBeGreaterThanOrEqual(1)
  })

  it('performBulkAction clone with partial failure returns errors and attempts rollback', async () => {
    const tenantId = 't1'
    // Prepare three serviceIds; mock getServiceById to return originals
    const serviceIds = ['a','b','c']
    // spy on cloneService to simulate success for 'a' and 'b', failure for 'c'
    const cloneSpy = vi.spyOn(svc as any, 'cloneService')
      .mockImplementation(async (name: string, fromId: string) => {
        if (fromId === 'c') throw new Error('clone failed')
        return { id: `clone-${fromId}`, name }
      })

    // mock prisma delete for rollback to succeed
    mockPrisma.service.delete.mockResolvedValue(undefined)

    const action = { action: 'clone', serviceIds } as any
    const result = await svc.performBulkAction(tenantId, action, 'tester')

    expect(result.updatedCount).toBe(2)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.length).toBeGreaterThanOrEqual(1)
    // ensure rollback attempted: delete called for created clones
    expect(mockPrisma.service.delete).toHaveBeenCalled()
  })
})
