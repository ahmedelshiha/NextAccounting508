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
