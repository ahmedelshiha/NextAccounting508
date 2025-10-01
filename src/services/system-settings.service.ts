import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import { SystemAdministrationSettingsSchema, type SystemAdministrationSettings } from '@/schemas/settings/system-administration'

const cache = new CacheService()
const keyFor = (tenantId: string | null) => `system-settings:${tenantId ?? 'default'}`

function defaults(): SystemAdministrationSettings {
  return SystemAdministrationSettingsSchema.parse({})
}

export class SystemSettingsService {
  async get(tenantId: string | null): Promise<SystemAdministrationSettings> {
    const key = keyFor(tenantId)
    const cached = await cache.get<SystemAdministrationSettings>(key)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.systemSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)
    const value: SystemAdministrationSettings = row ? {
      maintenanceMode: row.maintenanceMode ?? false,
      readOnlyMode: row.readOnlyMode ?? false,
      featureFlags: row.featureFlags ?? {},
      backup: row.backup ?? { enabled: false, retentionDays: 30 },
      impersonation: row.impersonation ?? { enabled: false, allowedRoles: ['ADMIN'] },
      session: row.session ?? { maxSessionMinutes: 1440, singleSession: false },
    } : defaults()

    await cache.set(key, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: Partial<SystemAdministrationSettings>, actorId?: string | null): Promise<SystemAdministrationSettings> {
    const parsed = SystemAdministrationSettingsSchema.partial().parse(updates || {})
    const anyPrisma = prisma as any

    let existing = await anyPrisma.systemSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)

    const data = {
      tenantId: tenantId ?? null,
      maintenanceMode: parsed.maintenanceMode ?? undefined,
      readOnlyMode: parsed.readOnlyMode ?? undefined,
      featureFlags: parsed.featureFlags ?? undefined,
      backup: parsed.backup ?? undefined,
      impersonation: parsed.impersonation ?? undefined,
      session: parsed.session ?? undefined,
      updatedAt: new Date(),
    }

    if (!existing) {
      // Create with defaults first to ensure row exists
      const created = await anyPrisma.systemSettings?.create?.({ data: { ...defaults(), tenantId: tenantId ?? null } }).catch?.(() => null)
      existing = created ?? null
    }

    if (existing) {
      await anyPrisma.systemSettings?.update?.({ where: { id: existing.id }, data }).catch?.(() => null)
    }

    await cache.delete(keyFor(tenantId))
    const updated = await this.get(tenantId)
    try { await logAudit({ action: 'system-settings:update', actorId: actorId ?? null, details: { tenantId, sections: Object.keys(parsed) } }) } catch {}
    return updated
  }
}

const systemSettingsService = new SystemSettingsService()
export default systemSettingsService
