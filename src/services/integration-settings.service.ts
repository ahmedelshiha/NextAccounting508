import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import { tenantFilter } from '@/lib/tenant'
import { resolveTenantId } from '@/lib/default-tenant'
import type { IntegrationHubSettings } from '@/schemas/settings/integration-hub'

function mask(value?: string | null, show = 4){
  if (!value) return undefined
  const s = String(value)
  return s.length > show ? s.slice(0, 2) + '*'.repeat(Math.max(3, s.length - show - 2)) + s.slice(-show) : '*'.repeat(Math.max(3, s.length))
}

export class IntegrationSettingsService {
  private cache = new CacheService()
  private cacheKey(tenantId: string | null){ return `integration:settings:${tenantId ?? 'default'}` }

  async get(tenantId: string | null){
    const key = this.cacheKey(tenantId)
    const cached = await this.cache.get<any>(key)
    if (cached) return cached

    const resolvedTenantId = await resolveTenantId(tenantId)
    const scope = tenantId ? tenantFilter(tenantId) : { tenantId: resolvedTenantId }
    const row = await prisma.integrationSettings.findFirst({ where: scope }).catch(() => null as any)
    const value = row ?? await this.createDefault(resolvedTenantId)
    await this.cache.set(key, value, 60)
    return value
  }

  async update(tenantId: string | null, payload: IntegrationHubSettings, actorId?: string | null){
    const existing = await prisma.integrationSettings.findFirst({ where: tenantFilter(tenantId) }).catch(()=>null as any)
    const next: any = {
      tenantId: tenantId ?? undefined,
      payments: { ...(existing?.payments ?? {}), ...(payload.payments ? {
        provider: payload.payments.provider ?? (existing?.payments?.provider ?? 'none'),
        publishableKeyMasked: payload.payments.publishableKey ? mask(payload.payments.publishableKey, 4) : (existing?.payments?.publishableKeyMasked ?? undefined),
        hasSecret: payload.payments.secretKey ? true : (existing?.payments?.hasSecret ?? false),
        testMode: payload.payments.testMode ?? (existing?.payments?.testMode ?? true),
      } : {}) },
      calendars: { ...(existing?.calendars ?? {}), ...(payload.calendars ?? {}) },
      comms: { ...(existing?.comms ?? {}), ...(payload.comms ? { sendgridConfigured: !!payload.comms.sendgridApiKey || (existing?.comms?.sendgridConfigured ?? false) } : {}) },
      analytics: { ...(existing?.analytics ?? {}), ...(payload.analytics ? { gaTrackingIdMasked: payload.analytics.gaTrackingId ? mask(payload.analytics.gaTrackingId, 3) : (existing?.analytics?.gaTrackingIdMasked ?? undefined) } : {}) },
      storage: { ...(existing?.storage ?? {}), ...(payload.storage ?? {}) },
    }
    const saved = existing
      ? await prisma.integrationSettings.update({ where: { id: existing.id }, data: next })
      : await prisma.integrationSettings.create({ data: next })
    await this.cache.delete(this.cacheKey(tenantId))
    try { await logAudit({ action: 'integration-settings:update', actorId: actorId ?? null, details: { tenantId, sections: Object.keys(payload) } }) } catch {}
    return saved
  }

  async testConnection(tenantId: string | null, provider: string, payload: Record<string, any>){
    switch(provider){
      case 'stripe':
        return { ok: typeof payload.publishableKey === 'string' && payload.publishableKey.length > 8 }
      case 'sendgrid':
        return { ok: typeof payload.apiKey === 'string' && payload.apiKey.startsWith('SG.') }
      default:
        return { ok: false, error: 'unsupported_provider' }
    }
  }

  private async createDefault(tenantId: string | null){
    const defaults: any = {
      tenantId: tenantId ?? undefined,
      payments: { provider: 'none', testMode: true },
      calendars: { googleConnected: false, outlookConnected: false },
      comms: { sendgridConfigured: false },
      analytics: {},
      storage: { provider: 'none' },
    }
    try {
      const created = await prisma.integrationSettings.create({ data: defaults })
      return created
    } catch {
      return defaults
    }
  }
}

const integrationSettingsService = new IntegrationSettingsService()
export default integrationSettingsService
