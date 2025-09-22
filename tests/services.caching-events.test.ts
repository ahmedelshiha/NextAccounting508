// Mock prisma before importing ServicesService
const mockPrisma: any = {
  service: {
    findMany: vi.fn(async () => [{ id: 's1', slug: 'a', name: 'A', description: 'd', shortDesc: '', features: [], price: 10, duration: 60, category: null, featured: false, active: true, image: null, createdAt: new Date(), updatedAt: new Date() }]),
    count: vi.fn(async () => 1),
    findFirst: vi.fn(async ({ where }: any) => ({ id: where.id || 's1', slug: 'a', name: 'A', description: 'd', shortDesc: '', features: [], price: 10, duration: 60, category: null, featured: false, active: true, image: null, createdAt: new Date(), updatedAt: new Date() })),
    create: vi.fn(async (args: any) => ({ id: 'new1', ...args.data, createdAt: new Date(), updatedAt: new Date() })),
  },
  booking: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
  serviceView: { groupBy: vi.fn(async () => []) },
}
vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))

// Mock notifications no-op
vi.mock('@/lib/notification.service', () => ({ NotificationService: class { async notifyServiceCreated(){} } }))

// Mock event bus
const emitSpy = vi.fn()
vi.mock('@/lib/events/service-events', () => ({ serviceEvents: { emit: emitSpy, on: vi.fn(), off: vi.fn() } }))

import { ServicesService } from '@/services/services.service'

class FakeCache {
  store = new Map<string, any>()
  async get<T>(k: string){ return (this.store.has(k) ? this.store.get(k) : null) as T | null }
  async set(k: string, v: any){ this.store.set(k, v) }
  async delete(){ }
  async deletePattern(){ }
}

describe('ServicesService caching and events', () => {
  it('caches list results by filter key', async () => {
    const cache: any = new FakeCache()
    const svc = new ServicesService(cache)
    const tenantId = 't1'
    const filters: any = { search: undefined, category: 'all', featured: 'all', status: 'all', limit: 20, offset: 0, sortBy: 'updatedAt', sortOrder: 'desc' }

    const r1 = await svc.getServicesList(tenantId, filters)
    const r2 = await svc.getServicesList(tenantId, filters)

    expect(Array.isArray(r1.services)).toBe(true)
    expect(r2.total).toBe(r1.total)
    expect(mockPrisma.service.findMany).toHaveBeenCalledTimes(1)
  })

  it('emits service:created on create', async () => {
    const cache: any = new FakeCache()
    const svc = new ServicesService(cache)
    const created = await svc.createService('t1', { name: 'New', slug: 'new', description: 'd', features: [], featured: false, active: true }, 'user1')
    expect(created.id).toBeDefined()
    expect(emitSpy).toHaveBeenCalled()
  })
})
