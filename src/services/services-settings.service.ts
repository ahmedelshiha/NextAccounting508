import fs from 'fs/promises'
import path from 'path'
import { CacheService } from '@/lib/cache.service'
import {
  ServicesSettingsSchema,
  ServiceRequestSettingsSchema,
  ServicesCoreSettingsSchema,
  NotificationServiceRequestTemplatesSchema,
  type ServicesSettings,
  type ServiceRequestSettings,
  type ServicesCoreSettings,
} from '@/schemas/settings/services'
import { z } from 'zod'

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'admin-settings-services.json')
const cache = new CacheService()
const CACHE_TTL_SECONDS = 120

const DEFAULT_SETTINGS = ServicesSettingsSchema.parse({})

const FlatServicesSettingsSchema = z.object({
  defaultCategory: ServicesCoreSettingsSchema.shape.defaultCategory.optional(),
  defaultCurrency: ServicesCoreSettingsSchema.shape.defaultCurrency.optional(),
  allowCloning: ServicesCoreSettingsSchema.shape.allowCloning.optional(),
  featuredToggleEnabled: ServicesCoreSettingsSchema.shape.featuredToggleEnabled.optional(),
  priceRounding: ServicesCoreSettingsSchema.shape.priceRounding.optional(),
  categories: z.array(z.string()).optional(),
  pricingRules: z.array(z.object({ currency: z.string(), multiplier: z.number() })).optional(),
  currencyOverrides: z.array(z.string()).optional(),
  versioningEnabled: z.boolean().optional(),
  versionRetention: z.number().optional(),
  defaultRequestStatus: ServiceRequestSettingsSchema.shape.defaultRequestStatus.optional(),
  autoAssign: ServiceRequestSettingsSchema.shape.autoAssign.optional(),
  autoAssignStrategy: ServiceRequestSettingsSchema.shape.autoAssignStrategy.optional(),
  allowConvertToBooking: ServiceRequestSettingsSchema.shape.allowConvertToBooking.optional(),
  defaultBookingType: ServiceRequestSettingsSchema.shape.defaultBookingType.optional(),
  // Optional notification templates (nested)
  notification: z.object({
    templates: z.object({
      serviceRequests: NotificationServiceRequestTemplatesSchema.optional(),
    }).optional(),
  }).optional(),
})

export type FlatServicesSettings = z.infer<typeof FlatServicesSettingsSchema>

type ServiceRequestTemplateUpdates = Partial<z.infer<typeof NotificationServiceRequestTemplatesSchema>>

// Updates shape allows partial nested groups for ergonomic patching
type ServicesSettingsUpdates = {
  services?: Partial<ServicesCoreSettings>
  serviceRequests?: Partial<ServiceRequestSettings>
  notification?: { templates?: { serviceRequests?: ServiceRequestTemplateUpdates } }
}

function mergeTemplateSettings(
  baseTemplates?: ServiceRequestTemplateUpdates,
  updates?: ServiceRequestTemplateUpdates,
): ServiceRequestTemplateUpdates {
  const next: Record<string, unknown> = { ...(baseTemplates ?? {}) }

  if (updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'undefined' || value === null) {
        delete next[key]
      } else if (typeof value === 'string') {
        next[key] = value
      }
    }
  }

  return NotificationServiceRequestTemplatesSchema.parse(next)
}

function mergeSettings(base: ServicesSettings, updates?: ServicesSettingsUpdates): ServicesSettings {
  if (!updates) return base
  const mergedTemplates = mergeTemplateSettings(
    base.notification?.templates?.serviceRequests,
    updates.notification?.templates?.serviceRequests,
  )

  return ServicesSettingsSchema.parse({
    services: { ...base.services, ...(updates.services ?? {}) },
    serviceRequests: { ...base.serviceRequests, ...(updates.serviceRequests ?? {}) },
    notification: {
      templates: {
        serviceRequests: mergedTemplates,
      },
    },
  })
}

function normalizeFromLegacy(raw: Record<string, unknown>): ServicesSettings {
  const parsedLegacy = FlatServicesSettingsSchema.parse(raw ?? {})
  const services: Partial<ServicesCoreSettings> = {
    defaultCategory: parsedLegacy.defaultCategory,
    defaultCurrency: parsedLegacy.defaultCurrency,
    allowCloning: parsedLegacy.allowCloning,
    featuredToggleEnabled: parsedLegacy.featuredToggleEnabled,
    priceRounding: parsedLegacy.priceRounding,
    categories: parsedLegacy.categories,
    pricingRules: parsedLegacy.pricingRules,
    currencyOverrides: parsedLegacy.currencyOverrides,
    versioningEnabled: parsedLegacy.versioningEnabled,
    versionRetention: parsedLegacy.versionRetention,
  }
  const serviceRequests: Partial<ServiceRequestSettings> = {
    defaultRequestStatus: parsedLegacy.defaultRequestStatus,
    autoAssign: parsedLegacy.autoAssign,
    autoAssignStrategy: parsedLegacy.autoAssignStrategy,
    allowConvertToBooking: parsedLegacy.allowConvertToBooking,
    defaultBookingType: parsedLegacy.defaultBookingType,
  }
  const notification = parsedLegacy.notification
    ? { templates: { serviceRequests: parsedLegacy.notification.templates?.serviceRequests } }
    : undefined
  return mergeSettings(DEFAULT_SETTINGS, { services, serviceRequests, notification })
}

async function readFile(): Promise<unknown> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function writeFile(settings: ServicesSettings): Promise<void> {
  const dir = path.dirname(SETTINGS_FILE_PATH)
  await fs.mkdir(dir, { recursive: true })
  // Persist in legacy flat shape to maintain backward compatibility with existing tools/tests
  const payload = flattenSettings(settings)
  await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8')
}

function cacheKey(tenantId: string | null) {
  return `services-settings:${tenantId ?? 'default'}`
}

function coerceSettings(raw: unknown): ServicesSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SETTINGS
  }
  if ('services' in (raw as any) || 'serviceRequests' in (raw as any)) {
    return ServicesSettingsSchema.parse(raw)
  }
  return normalizeFromLegacy(raw as Record<string, unknown>)
}

function flattenSettings(settings: ServicesSettings): FlatServicesSettings {
  const templates = NotificationServiceRequestTemplatesSchema.parse(
    settings.notification?.templates?.serviceRequests ?? {},
  )
  const templateEntries = Object.entries(templates).filter(([, value]) => typeof value === 'string')
  const normalizedTemplates = Object.fromEntries(templateEntries) as ServiceRequestTemplateUpdates
  const hasTemplates = templateEntries.length > 0

  return {
    defaultCategory: settings.services.defaultCategory,
    defaultCurrency: settings.services.defaultCurrency,
    allowCloning: settings.services.allowCloning,
    featuredToggleEnabled: settings.services.featuredToggleEnabled,
    priceRounding: settings.services.priceRounding,
    categories: settings.services.categories ?? [],
    pricingRules: settings.services.pricingRules ?? [],
    currencyOverrides: settings.services.currencyOverrides ?? [],
    versioningEnabled: settings.services.versioningEnabled ?? false,
    versionRetention: settings.services.versionRetention ?? 0,
    defaultRequestStatus: settings.serviceRequests.defaultRequestStatus,
    autoAssign: settings.serviceRequests.autoAssign,
    autoAssignStrategy: settings.serviceRequests.autoAssignStrategy,
    allowConvertToBooking: settings.serviceRequests.allowConvertToBooking,
    defaultBookingType: settings.serviceRequests.defaultBookingType,
    notification: hasTemplates ? { templates: { serviceRequests: normalizedTemplates } } : undefined,
  }
}

function expandFlatSettings(flat: FlatServicesSettings): ServicesSettingsUpdates {
  const parsed = FlatServicesSettingsSchema.parse(flat)
  const templateUpdates = parsed.notification?.templates?.serviceRequests

  return {
    services: {
      defaultCategory: parsed.defaultCategory,
      defaultCurrency: parsed.defaultCurrency,
      allowCloning: parsed.allowCloning,
      featuredToggleEnabled: parsed.featuredToggleEnabled,
      priceRounding: parsed.priceRounding,
      categories: parsed.categories,
      pricingRules: parsed.pricingRules,
      currencyOverrides: parsed.currencyOverrides,
      versioningEnabled: parsed.versioningEnabled,
      versionRetention: parsed.versionRetention,
    },
    serviceRequests: {
      defaultRequestStatus: parsed.defaultRequestStatus,
      autoAssign: parsed.autoAssign,
      autoAssignStrategy: parsed.autoAssignStrategy,
      allowConvertToBooking: parsed.allowConvertToBooking,
      defaultBookingType: parsed.defaultBookingType,
    },
    notification: typeof templateUpdates !== 'undefined' ? { templates: { serviceRequests: templateUpdates } } : undefined,
  }
}

export class ServicesSettingsService {
  async get(tenantId: string | null = null): Promise<ServicesSettings> {
    const key = cacheKey(tenantId)
    const cached = await cache.get<ServicesSettings>(key)
    if (cached) return cached

    const raw = await readFile()
    const settings = coerceSettings(raw)
    await cache.set(key, settings, CACHE_TTL_SECONDS)
    return settings
  }

  async getFlat(tenantId: string | null = null): Promise<FlatServicesSettings> {
    const settings = await this.get(tenantId)
    return flattenSettings(settings)
  }

  async save(flatOrNested: ServicesSettingsUpdates | FlatServicesSettings, tenantId: string | null = null): Promise<ServicesSettings> {
    const current = await this.get(tenantId)
    const updates = 'services' in (flatOrNested as any) || 'serviceRequests' in (flatOrNested as any)
      ? (flatOrNested as ServicesSettingsUpdates)
      : expandFlatSettings(flatOrNested as FlatServicesSettings)

    const merged = mergeSettings(current, updates)
    await writeFile(merged)
    await cache.set(cacheKey(tenantId), merged, CACHE_TTL_SECONDS)
    return merged
  }

  async replace(next: ServicesSettings, tenantId: string | null = null): Promise<ServicesSettings> {
    const parsed = ServicesSettingsSchema.parse(next)
    await writeFile(parsed)
    await cache.set(cacheKey(tenantId), parsed, CACHE_TTL_SECONDS)
    return parsed
  }

  async clearCache(tenantId: string | null = null): Promise<void> {
    await cache.delete(cacheKey(tenantId))
  }
}

const servicesSettingsService = new ServicesSettingsService()
export { servicesSettingsService as default, flattenSettings, expandFlatSettings, DEFAULT_SETTINGS as DEFAULT_SERVICES_SETTINGS }
