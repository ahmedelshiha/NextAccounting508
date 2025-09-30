import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import type { SecurityComplianceSettings } from '@/schemas/settings/security-compliance'
import { SecurityComplianceSettingsSchema } from '@/schemas/settings/security-compliance'

const cache = new CacheService()

function keyFor(tenantId: string | null) { return `security-settings:${tenantId ?? 'default'}` }

function defaults(): SecurityComplianceSettings {
  return SecurityComplianceSettingsSchema.parse({})
}

export class SecuritySettingsService {
  async get(tenantId: string | null): Promise<SecurityComplianceSettings> {
    const cacheKey = keyFor(tenantId)
    const cached = await cache.get<SecurityComplianceSettings>(cacheKey)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.securitySettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)
    const value: SecurityComplianceSettings = row ? {
      passwordPolicy: row.passwordPolicy ?? {},
      sessionSecurity: row.sessionSecurity ?? {},
      twoFactor: row.twoFactor ?? {},
      network: row.network ?? {},
      dataProtection: row.dataProtection ?? {},
      compliance: row.compliance ?? {},
    } : defaults()

    await cache.set(cacheKey, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: Partial<SecurityComplianceSettings>): Promise<SecurityComplianceSettings> {
    const parsed = SecurityComplianceSettingsSchema.partial().parse(updates || {})

    const anyPrisma = prisma as any
    let existing = await anyPrisma.securitySettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)

    if (!existing) {
      const created = await anyPrisma.securitySettings?.create?.({ data: { ...defaults(), tenantId: tenantId ?? null } })
      existing = created ?? null
    }

    const data = {
      tenantId: tenantId ?? null,
      passwordPolicy: parsed.passwordPolicy ?? undefined,
      sessionSecurity: parsed.sessionSecurity ?? undefined,
      twoFactor: parsed.twoFactor ?? undefined,
      network: parsed.network ?? undefined,
      dataProtection: parsed.dataProtection ?? undefined,
      compliance: parsed.compliance ?? undefined,
      updatedAt: new Date(),
    }

    await anyPrisma.securitySettings?.update?.({ where: { id: existing.id }, data })

    await cache.delete(keyFor(tenantId))
    const updated = await this.get(tenantId)
    await logAudit({ action: 'security-settings:update', details: { tenantId, sections: Object.keys(parsed) } })
    return updated
  }
}

const securitySettingsService = new SecuritySettingsService()
export default securitySettingsService
