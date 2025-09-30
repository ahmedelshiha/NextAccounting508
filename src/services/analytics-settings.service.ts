import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import { AnalyticsReportingSettingsSchema, type AnalyticsReportingSettings } from '@/schemas/settings/analytics-reporting'

const cache = new CacheService()
function keyFor(tenantId: string | null) { return `analytics-settings:${tenantId ?? 'default'}` }

export class AnalyticsSettingsService {
  async get(tenantId: string | null): Promise<AnalyticsReportingSettings> {
    const cacheKey = keyFor(tenantId)
    const cached = await cache.get<AnalyticsReportingSettings>(cacheKey)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.analyticsSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)
    const value: AnalyticsReportingSettings = row ? {
      dashboards: row.dashboards ?? [],
      metrics: row.metrics ?? [],
      exportsEnabled: row.exportsEnabled ?? true,
      dataRetentionDays: row.dataRetentionDays ?? 365,
      integrations: row.integrations ?? [],
    } : AnalyticsReportingSettingsSchema.parse({})

    await cache.set(cacheKey, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: Partial<AnalyticsReportingSettings>): Promise<AnalyticsReportingSettings> {
    const parsed = AnalyticsReportingSettingsSchema.partial().parse(updates || {})
    const anyPrisma = prisma as any
    let existing = await anyPrisma.analyticsSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)

    const data = {
      tenantId: tenantId ?? null,
      dashboards: parsed.dashboards ?? undefined,
      metrics: parsed.metrics ?? undefined,
      exportsEnabled: parsed.exportsEnabled ?? undefined,
      dataRetentionDays: parsed.dataRetentionDays ?? undefined,
      integrations: parsed.integrations ?? undefined,
      updatedAt: new Date(),
    }

    if (!existing) {
      const created = await anyPrisma.analyticsSettings?.create?.({ data: { ...AnalyticsReportingSettingsSchema.parse({}), tenantId: tenantId ?? null } }).catch?.(() => null)
      existing = created ?? null
    }

    if (existing) {
      await anyPrisma.analyticsSettings?.update?.({ where: { id: existing.id }, data }).catch?.(() => null)
    }

    await cache.delete(keyFor(tenantId))
    const updated = await this.get(tenantId)
    try { await logAudit({ action: 'analytics-settings:update', details: { tenantId, sections: Object.keys(parsed) } }) } catch {}
    return updated
  }
}

const analyticsSettingsService = new AnalyticsSettingsService()
export default analyticsSettingsService
