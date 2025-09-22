import { EventEmitter } from 'events'
import { CacheService } from '@/lib/cache.service'

// Event payloads for services domain
export type ServiceCreatedEvent = { tenantId: string | null; service: { id: string; slug: string; name: string } }
export type ServiceUpdatedEvent = { tenantId: string | null; service: { id: string; slug: string; name: string }; changes: string[] }
export type ServiceDeletedEvent = { tenantId: string | null; id: string }
export type ServiceBulkEvent = { tenantId: string | null; action: string; count: number }

export type ServiceEventMap = {
  'service:created': ServiceCreatedEvent
  'service:updated': ServiceUpdatedEvent
  'service:deleted': ServiceDeletedEvent
  'service:bulk': ServiceBulkEvent
}

type EventKey = keyof ServiceEventMap

type Handler<K extends EventKey> = (payload: ServiceEventMap[K]) => void | Promise<void>

class TypedEventBus {
  private emitter = new EventEmitter()

  on<K extends EventKey>(event: K, handler: Handler<K>) { this.emitter.on(event, handler as any) }
  off<K extends EventKey>(event: K, handler: Handler<K>) { this.emitter.off(event, handler as any) }
  emit<K extends EventKey>(event: K, payload: ServiceEventMap[K]) { this.emitter.emit(event, payload) }
}

export const serviceEvents = new TypedEventBus()

let registered = false
function registerDefaultListeners() {
  if (registered) return
  registered = true

  const cache = new CacheService()

  const invalidate = async (tenantId: string | null, serviceId?: string) => {
    const patterns = [
      `service-stats:${tenantId}:*`,
      `services-list:${tenantId}:*`,
      `service:*:${tenantId}`,
    ]
    await Promise.all(patterns.map((p) => cache.deletePattern(p)))
    if (serviceId) await cache.delete(`service:${serviceId}:${tenantId}`)
  }

  const warm = async (tenantId: string | null) => {
    try {
      // Dynamic import to avoid circular dependency at module load
      const mod = await (Function('m', 'return import(m)'))<Promise<any>>('@/services/services.service')
      const svc = new mod.ServicesService()
      // Warm a couple of hot queries and stats
      const combos: Array<{ featured?: 'all' | 'featured' | 'non-featured'; status?: 'all' | 'active' | 'inactive' }> = [
        { featured: 'all', status: 'active' },
        { featured: 'featured', status: 'active' },
      ]
      await Promise.all([
        ...combos.map((c) => svc.getServicesList(tenantId, { search: undefined, category: 'all', featured: c.featured as any, status: c.status as any, limit: 10, offset: 0, sortBy: 'updatedAt', sortOrder: 'desc' } as any)),
        svc.getServiceStats(tenantId, '30d'),
      ])
    } catch {}
  }

  serviceEvents.on('service:created', async (e) => { await invalidate(e.tenantId, e.service.id); setTimeout(() => { void warm(e.tenantId) }, 0) })
  serviceEvents.on('service:updated', async (e) => { await invalidate(e.tenantId, e.service.id); setTimeout(() => { void warm(e.tenantId) }, 0) })
  serviceEvents.on('service:deleted', async (e) => { await invalidate(e.tenantId, e.id); setTimeout(() => { void warm(e.tenantId) }, 0) })
  serviceEvents.on('service:bulk', async (e) => { await invalidate(e.tenantId); setTimeout(() => { void warm(e.tenantId) }, 0) })
}

registerDefaultListeners()
