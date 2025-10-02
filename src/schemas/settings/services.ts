import { z } from 'zod'

// Core service configuration keys (used by admin Services UI and service creation defaults)
export const ServicesCoreSettingsSchema = z.object({
  defaultCategory: z.string().min(1).max(120).default('General'),
  defaultCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('USD'),
  allowCloning: z.boolean().default(true),
  featuredToggleEnabled: z.boolean().default(true),
  priceRounding: z.number().int().min(0).max(6).default(2),
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

export const ServicesSettingsSchema = z.object({
  services: ServicesCoreSettingsSchema.default({
    defaultCategory: 'General',
    defaultCurrency: 'USD',
    allowCloning: true,
    featuredToggleEnabled: true,
    priceRounding: 2,
  }),
  serviceRequests: ServiceRequestSettingsSchema.default({
    defaultRequestStatus: 'SUBMITTED',
    autoAssign: true,
    autoAssignStrategy: 'round_robin',
    allowConvertToBooking: true,
    defaultBookingType: 'STANDARD',
  }),
}).default({
  services: {
    defaultCategory: 'General',
    defaultCurrency: 'USD',
    allowCloning: true,
    featuredToggleEnabled: true,
    priceRounding: 2,
  },
  serviceRequests: {
    defaultRequestStatus: 'SUBMITTED',
    autoAssign: true,
    autoAssignStrategy: 'round_robin',
    allowConvertToBooking: true,
    defaultBookingType: 'STANDARD',
  },
})

export type ServicesCoreSettings = z.infer<typeof ServicesCoreSettingsSchema>
export type ServiceRequestSettings = z.infer<typeof ServiceRequestSettingsSchema>
export type ServicesSettings = z.infer<typeof ServicesSettingsSchema>
