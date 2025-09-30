import { z } from 'zod'

export const BookingStepSchema = z.object({
  stepName: z.string().optional(),
  stepOrder: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
  required: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  validationRules: z.any().optional(),
  customFields: z.any().optional(),
})

export const BookingStepsArraySchema = z.array(BookingStepSchema)

export const BusinessHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  isWorkingDay: z.boolean().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  breakStartTime: z.string().nullable().optional(),
  breakEndTime: z.string().nullable().optional(),
  maxBookingsPerHour: z.number().int().min(0).optional(),
})

export const BusinessHoursArraySchema = z.array(BusinessHoursSchema)

export const PaymentMethodSchema = z.object({
  methodType: z.string(),
  enabled: z.boolean().optional(),
  displayName: z.string().optional(),
  description: z.string().nullable().optional(),
  processingFee: z.number().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().nullable().optional(),
  gatewayConfig: z.any().nullable().optional(),
})

export const PaymentMethodsArraySchema = z.array(PaymentMethodSchema)

export const BookingSettingsBusinessHoursPayload = z.object({ businessHours: BusinessHoursArraySchema })
export const BookingSettingsStepsPayload = z.object({ steps: BookingStepsArraySchema })
export const BookingSettingsPaymentMethodsPayload = z.object({ paymentMethods: PaymentMethodsArraySchema })

// Additional booking settings slices added for enhanced configuration
export const BookingAutomationSchema = z.object({
  autoConfirm: z.boolean().default(false),
  confirmIf: z.enum(['always','known-client','paid']).default('known-client'),
  followUps: z.array(z.object({ hoursAfter: z.number().min(1).max(8760), templateId: z.string() })).max(20).default([]),
  cancellationPolicy: z.object({ hoursBefore: z.number().min(0).max(720), feePercent: z.number().min(0).max(100) }).default({ hoursBefore: 24, feePercent: 0 })
})

export const BookingIntegrationsSchema = z.object({
  calendarSync: z.enum(['none','google','outlook','ical']).default('none'),
  conferencing: z.enum(['none','zoom','meet']).default('none')
})

export const BookingCapacitySchema = z.object({
  pooledResources: z.boolean().default(false),
  concurrentLimit: z.number().int().min(1).max(100).default(5),
  waitlist: z.boolean().default(false)
})

export const BookingFormsSchema = z.object({
  fields: z.array(z.object({ key: z.string().min(1), label: z.string().min(1), type: z.enum(['text','select','number','date']), required: z.boolean().default(false), options: z.array(z.string()).optional() })).max(100).default([]),
  rules: z.array(z.object({ ifField: z.string(), equals: z.string().optional(), thenRequire: z.array(z.string()).default([]) })).max(100).default([])
})

export const BookingSettingsAutomationPayload = z.object({ automation: BookingAutomationSchema })
export const BookingSettingsIntegrationsPayload = z.object({ integrations: BookingIntegrationsSchema })
export const BookingSettingsCapacityPayload = z.object({ capacity: BookingCapacitySchema })
export const BookingSettingsFormsPayload = z.object({ forms: BookingFormsSchema })
