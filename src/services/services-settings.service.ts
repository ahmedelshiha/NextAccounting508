import fs from 'fs/promises'
import path from 'path'
import { CacheService } from '@/lib/cache.service'
import {
  ServicesSettingsSchema,
  ServiceRequestSettingsSchema,
  ServicesCoreSettingsSchema,
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
  defaultRequestStatus: ServiceRequestSettingsSchema.shape.defaultRequestStatus.optional(),
  autoAssign: ServiceRequestSettingsSchema.shape.autoAssign.optional(),
  autoAssignStrategy: ServiceRequestSettingsSchema.shape.autoAssignStrategy.optional(),
  allowConvertToBooking: ServiceRequestSettingsSchema.shape.allowConvertToBooking.optional(),
  defaultBookingType: ServiceRequestSettingsSchema.shape.defaultBookingType.optional(),
})

export type FlatServicesSettings = z.infer<typeof FlatServicesSettingsSchema>

function mergeSettings(base: ServicesSettings, updates?: Partial<ServicesSettings>): ServicesSettings {
  if (!updates) return base
  return ServicesSettingsSchema.parse({
    services: { ...base.services, ...(updates.services ?? {}) },
    serviceRequests: { ...base.serviceRequests, ...(updates.serviceRequests ?? {}) },
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
  }
  const serviceRequests: Partial<ServiceRequestSettings> = {
    defaultRequestStatus: parsedLegacy.defaultRequestStatus,
    autoAssign: parsedLegacy.autoAssign,
    autoAssignStrategy: parsedLegacy.autoAssignStrategy,
    allowConvertToBooking: parsedLegacy.allowConvertToBooking,
    defaultBookingType: parsedLegacy.defaultBookingType,
  }
  return mergeSettings(DEFAULT_SETTINGS, { services, serviceRequests })
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
  await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8')
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
  return {
    defaultCategory: settings.services.defaultCategory,
    defaultCurrency: settings.services.defaultCurrency,
    allowCloning: settings.services.allowCloning,
    featuredToggleEnabled: settings.services.featuredToggleEnabled,
    priceRounding: settings.services.priceRounding,
    defaultRequestStatus: settings.serviceRequests.defaultRequestStatus,
    autoAssign: settings.serviceRequests.autoAssign,
    autoAssignStrategy: settings.serviceRequests.autoAssignStrategy,
    allowConvertToBooking: settings.serviceRequests.allowConvertToBooking,
    defaultBookingType: settings.serviceRequests.defaultBookingType,
  }
}

function expandFlatSettings(flat: FlatServicesSettings): Partial<ServicesSettings> {
  const parsed = FlatServicesSettingsSchema.parse(flat)
  return {
    services: {
      defaultCategory: parsed.defaultCategory,
      defaultCurrency: parsed.defaultCurrency,
      allowCloning: parsed.allowCloning,
      featuredToggleEnabled: parsed.featuredToggleEnabled,
      priceRounding: parsed.priceRounding,
    },
    serviceRequests: {
      defaultRequestStatus: parsed.defaultRequestStatus,
      autoAssign: parsed.autoAssign,
      autoAssignStrategy: parsed.autoAssignStrategy,
      allowConvertToBooking: parsed.allowConvertToBooking,
      defaultBookingType: parsed.defaultBookingType,
    },
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

  async save(flatOrNested: Partial<ServicesSettings> | FlatServicesSettings, tenantId: string | null = null): Promise<ServicesSettings> {
    const current = await this.get(tenantId)
    const updates = 'services' in (flatOrNested as any) || 'serviceRequests' in (flatOrNested as any)
      ? (flatOrNested as Partial<ServicesSettings>)
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
