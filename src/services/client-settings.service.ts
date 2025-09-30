import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import type { ClientManagementSettings } from '@/schemas/settings/client-management'
import { ClientManagementSettingsSchema } from '@/schemas/settings/client-management'

const cache = new CacheService()

function keyFor(tenantId: string | null) { return `client-settings:${tenantId ?? 'default'}` }

function defaults(): ClientManagementSettings {
  const parsed = ClientManagementSettingsSchema.parse({})
  return parsed
}

export class ClientSettingsService {
  async get(tenantId: string | null): Promise<ClientManagementSettings> {
    const cacheKey = keyFor(tenantId)
    const cached = await cache.get<ClientManagementSettings>(cacheKey)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.clientSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)
    const value: ClientManagementSettings = row ? {
      registration: row.registration ?? {},
      profiles: row.profiles ?? {},
      communication: row.communication ?? {},
      segmentation: row.segmentation ?? {},
      loyalty: row.loyalty ?? {},
      portal: row.portal ?? {},
    } : defaults()

    await cache.set(cacheKey, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: Partial<ClientManagementSettings>): Promise<ClientManagementSettings> {
    const parsed = ClientManagementSettingsSchema.partial().parse(updates || {})

    const anyPrisma = prisma as any
    let existing = await anyPrisma.clientSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)

    const data = {
      tenantId: tenantId ?? null,
      registration: parsed.registration ?? undefined,
      profiles: parsed.profiles ?? undefined,
      communication: parsed.communication ?? undefined,
      segmentation: parsed.segmentation ?? undefined,
      loyalty: parsed.loyalty ?? undefined,
      portal: parsed.portal ?? undefined,
      updatedAt: new Date(),
    }

    if (!existing) {
      // create
      const created = await anyPrisma.clientSettings?.create?.({ data: { ...defaults(), tenantId: tenantId ?? null } })
      existing = created ?? null
    }

    await anyPrisma.clientSettings?.update?.({ where: { id: existing.id }, data })

    await cache.delete(keyFor(tenantId))
    const updated = await this.get(tenantId)
    await logAudit({ action: 'client-settings:update', details: { tenantId, sections: Object.keys(parsed) } })
    return updated
  }
}

const clientSettingsService = new ClientSettingsService()
export default clientSettingsService
