import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import { tenantFilter } from '@/lib/tenant'
import type { FinancialSettingsPayload } from '@/schemas/settings/financial'

export class FinancialSettingsService {
  private cache = new CacheService()

  private cacheKey(tenantId: string | null) { return `financial:settings:${tenantId ?? 'default'}` }

  async get(tenantId: string | null) {
    const key = this.cacheKey(tenantId)
    const cached = await this.cache.get<any>(key)
    if (cached) return cached
    const prismaAny = prisma as any
    const row = await prismaAny.financialSettings?.findFirst({ where: tenantFilter(tenantId) }).catch(() => null as any)
    const value = row ?? await this.createDefault(tenantId)
    await this.cache.set(key, value, 60)
    return value
  }

  async update(tenantId: string | null, payload: FinancialSettingsPayload, actorId?: string | null) {
    const prismaAny = prisma as any
    const existing = await prismaAny.financialSettings?.findFirst({ where: tenantFilter(tenantId) }).catch(() => null as any)
    const data: any = {
      tenantId: tenantId ?? undefined,
      invoicing: { ...(existing?.invoicing ?? {}), ...(payload.invoicing ?? {}) },
      payments: { ...(existing?.payments ?? {}), ...(payload.payments ?? {}) },
      taxes: { ...(existing?.taxes ?? {}), ...(payload.taxes ?? {}) },
      currencies: { ...(existing?.currencies ?? {}), ...(payload.currencies ?? {}) },
      reconciliation: { ...(existing?.reconciliation ?? {}), ...(payload.reconciliation ?? {}) },
    }
    const prismaAny = prisma as any
    const saved = existing
      ? await prismaAny.financialSettings?.update({ where: { id: existing.id }, data })
      : await prismaAny.financialSettings?.create({ data })

    await this.cache.delete(this.cacheKey(tenantId))
    try { await logAudit({ action: 'financial-settings:update', actorId: actorId ?? null, details: { tenantId, sections: Object.keys(payload) } }) } catch {}
    return saved
  }

  private async createDefault(tenantId: string | null) {
    const defaults = {
      tenantId: tenantId ?? undefined,
      invoicing: { invoicePrefix: 'INV', nextNumber: 1, dueDaysDefault: 30, autoNumbering: true, sendInvoiceEmail: true },
      payments: { currency: 'USD', allowCOD: false, allowBankTransfer: true, allowCard: true, paymentProvider: 'none', captureMode: 'authorize_capture' },
      taxes: { taxInclusive: false, defaultRate: 0, regionOverrides: {} },
      currencies: { base: 'USD', enabled: ['USD'], roundingMode: 'HALF_UP' },
      reconciliation: { autoMatchThresholdCents: 200, lockPeriodDays: 0, requireTwoPersonApproval: false },
    } as any
    try {
      const prismaAny = prisma as any
      const created = await prismaAny.financialSettings?.create({ data: defaults })
      return created
    } catch {
      // If table missing in local env, return in-memory defaults to avoid hard failure
      return defaults
    }
  }
}

const financialSettingsService = new FinancialSettingsService()
export default financialSettingsService
