import { z } from 'zod'

// Core service configuration keys (used by admin Services UI and service creation defaults)
export const PricingRuleSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  multiplier: z.number().min(0.0001).default(1),
})

export const ServicesCoreSettingsSchema = z.object({
  defaultCategory: z.string().min(1).max(120).default('General'),
  defaultCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('USD'),
  allowCloning: z.boolean().default(true),
  featuredToggleEnabled: z.boolean().default(true),
  priceRounding: z.number().int().min(0).max(6).default(2),
  categories: z.array(z.string().min(1)).default([]),
  pricingRules: z.array(PricingRuleSchema).default([]),
  currencyOverrides: z.array(z.string().regex(/^[A-Z]{3}$/)).default([]),
  versioningEnabled: z.boolean().default(true),
  versionRetention: z.number().int().min(0).default(5),
})

// Enumerations sourced from Prisma schema to ensure parity with persisted data
export const ServiceRequestStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

export const ServiceRequestAutoAssignStrategyEnum = z.enum([
  'round_robin',
  'load_based',
  'skill_based',
])

export const BookingTypeEnum = z.enum(['STANDARD', 'RECURRING', 'EMERGENCY', 'CONSULTATION'])

// Workflow controls for handling service requests from intake through booking conversion
export const ServiceRequestSettingsSchema = z.object({
  defaultRequestStatus: ServiceRequestStatusEnum.default('SUBMITTED'),
  autoAssign: z.boolean().default(true),
  autoAssignStrategy: ServiceRequestAutoAssignStrategyEnum.default('round_robin'),
  allowConvertToBooking: z.boolean().default(true),
  defaultBookingType: BookingTypeEnum.default('STANDARD'),
})

export const NotificationServiceRequestTemplatesSchema = z.object({
  created: z.string().optional(),
  assigned: z.string().optional(),
  statusChanged: z.string().optional(),
}).default({})

export const NotificationTemplatesSchema = z.object({
  serviceRequests: NotificationServiceRequestTemplatesSchema.default({})
}).default({})

export const ServicesSettingsSchema = z.object({
  services: ServicesCoreSettingsSchema.default({
    defaultCategory: 'General',
    defaultCurrency: 'USD',
    allowCloning: true,
    featuredToggleEnabled: true,
    priceRounding: 2,
    categories: [],
    pricingRules: [],
    currencyOverrides: [],
    versioningEnabled: true,
    versionRetention: 5,
  }),
  serviceRequests: ServiceRequestSettingsSchema.default({
    defaultRequestStatus: 'SUBMITTED',
    autoAssign: true,
    autoAssignStrategy: 'round_robin',
    allowConvertToBooking: true,
    defaultBookingType: 'STANDARD',
  }),
  notification: NotificationTemplatesSchema.default({}),
}).default({
  services: {
    defaultCategory: 'General',
    defaultCurrency: 'USD',
    allowCloning: true,
    featuredToggleEnabled: true,
    priceRounding: 2,
    categories: [],
    pricingRules: [],
    currencyOverrides: [],
    versioningEnabled: true,
    versionRetention: 5,
  },
  serviceRequests: {
    defaultRequestStatus: 'SUBMITTED',
    autoAssign: true,
    autoAssignStrategy: 'round_robin',
    allowConvertToBooking: true,
    defaultBookingType: 'STANDARD',
  },
  notification: {},
})

export type ServicesCoreSettings = z.infer<typeof ServicesCoreSettingsSchema>
export type ServiceRequestSettings = z.infer<typeof ServiceRequestSettingsSchema>
export type ServicesSettings = z.infer<typeof ServicesSettingsSchema>
