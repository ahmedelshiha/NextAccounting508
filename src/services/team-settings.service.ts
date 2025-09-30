import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import { TeamSettingsSchema, type TeamSettings } from '@/schemas/settings/team-management'

const cache = new CacheService()
function keyFor(tenantId: string | null) { return `team-settings:${tenantId ?? 'default'}` }

export class TeamSettingsService {
  async get(tenantId: string | null): Promise<TeamSettings> {
    const cacheKey = keyFor(tenantId)
    const cached = await cache.get<TeamSettings>(cacheKey)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.teamSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)
    const value: TeamSettings = row ? {
      structure: row.structure ?? {},
      availability: row.availability ?? {},
      skills: row.skills ?? {},
      workload: row.workload ?? {},
      performance: row.performance ?? {},
    } : TeamSettingsSchema.parse({})

    await cache.set(cacheKey, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: Partial<TeamSettings>): Promise<TeamSettings> {
    const parsed = TeamSettingsSchema.partial().parse(updates || {})
    const anyPrisma = prisma as any
    let existing = await anyPrisma.teamSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)

    const data = {
      tenantId: tenantId ?? null,
      structure: parsed.structure ?? undefined,
      availability: parsed.availability ?? undefined,
      skills: parsed.skills ?? undefined,
      workload: parsed.workload ?? undefined,
      performance: parsed.performance ?? undefined,
      updatedAt: new Date(),
    }

    if (!existing) {
      // create with defaults
      const created = await anyPrisma.teamSettings?.create?.({ data: { ...TeamSettingsSchema.parse({}), tenantId: tenantId ?? null } }).catch?.(() => null)
      existing = created ?? null
    }

    if (existing) {
      await anyPrisma.teamSettings?.update?.({ where: { id: existing.id }, data }).catch?.(() => null)
    }

    await cache.delete(keyFor(tenantId))
    const updated = await this.get(tenantId)
    try { await logAudit({ action: 'team-settings:update', details: { tenantId, sections: Object.keys(parsed) } }) } catch {}
    return updated
  }
}

const teamSettingsService = new TeamSettingsService()
export default teamSettingsService
