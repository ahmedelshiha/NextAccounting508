import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import { TaskWorkflowSettingsSchema, type TaskWorkflowSettings } from '@/schemas/settings/task-workflow'

const cache = new CacheService()
function keyFor(tenantId: string | null) { return `task-settings:${tenantId ?? 'default'}` }

export class TaskSettingsService {
  async get(tenantId: string | null): Promise<TaskWorkflowSettings> {
    const cacheKey = keyFor(tenantId)
    const cached = await cache.get<TaskWorkflowSettings>(cacheKey)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.taskSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)
    const value: TaskWorkflowSettings = row ? {
      templates: row.templates ?? [],
      statuses: row.statuses ?? [],
      automation: row.automation ?? [],
      board: row.board ?? {},
      dependenciesEnabled: row.dependenciesEnabled ?? true,
    } : TaskWorkflowSettingsSchema.parse({})

    await cache.set(cacheKey, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: Partial<TaskWorkflowSettings>): Promise<TaskWorkflowSettings> {
    const parsed = TaskWorkflowSettingsSchema.partial().parse(updates || {})
    const anyPrisma = prisma as any
    let existing = await anyPrisma.taskSettings?.findFirst?.({ where: { tenantId: tenantId ?? undefined } }).catch?.(() => null)

    const data = {
      tenantId: tenantId ?? null,
      templates: parsed.templates ?? undefined,
      statuses: parsed.statuses ?? undefined,
      automation: parsed.automation ?? undefined,
      board: parsed.board ?? undefined,
      dependenciesEnabled: parsed.dependenciesEnabled ?? undefined,
      updatedAt: new Date(),
    }

    if (!existing) {
      const created = await anyPrisma.taskSettings?.create?.({ data: { ...TaskWorkflowSettingsSchema.parse({}), tenantId: tenantId ?? null } }).catch?.(() => null)
      existing = created ?? null
    }

    if (existing) {
      await anyPrisma.taskSettings?.update?.({ where: { id: existing.id }, data }).catch?.(() => null)
    }

    await cache.delete(keyFor(tenantId))
    const updated = await this.get(tenantId)
    try { await logAudit({ action: 'task-settings:update', details: { tenantId, sections: Object.keys(parsed) } }) } catch {}
    return updated
  }
}

const taskSettingsService = new TaskSettingsService()
export default taskSettingsService
