import { z } from 'zod'

// Shared base schema for creating a portal Service Request (request or booking)
export const PortalCreateBaseSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300).optional(),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW','MEDIUM','HIGH','URGENT']),
    z.enum(['low','medium','high','urgent']).transform(v => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
  ]).default('MEDIUM'),
  budgetMin: z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (typeof v === 'string') return Number(v)
    return v
  }, z.number().optional()),
  budgetMax: z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (typeof v === 'string') return Number(v)
    return v
  }, z.number().optional()),
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.any().optional(),
})

// Create a non-booking service request (task)
export const PortalCreateRequestSchema = PortalCreateBaseSchema.extend({
  isBooking: z.literal(false).optional(),
  deadline: z.string().datetime().optional(),
})

// Create a booking service request (appointment)
export const PortalCreateBookingSchema = PortalCreateBaseSchema.extend({
  isBooking: z.literal(true),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  bookingType: z.enum(['STANDARD','RECURRING','EMERGENCY','CONSULTATION']).optional(),
  recurringPattern: z.object({
    frequency: z.enum(['DAILY','WEEKLY','MONTHLY']),
    interval: z.number().int().positive().optional(),
    count: z.number().int().positive().optional(),
    until: z.string().datetime().optional(),
    byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
  }).optional(),
})

export const PortalCreateSchema = z.union([PortalCreateRequestSchema, PortalCreateBookingSchema])

export type PortalCreateRequest = z.infer<typeof PortalCreateRequestSchema>
export type PortalCreateBooking = z.infer<typeof PortalCreateBookingSchema>
export type PortalCreatePayload = z.infer<typeof PortalCreateSchema>
