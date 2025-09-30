import { z } from 'zod'

export const PaymentsIntegrationSchema = z.object({
  provider: z.enum(['none','stripe','paypal']).default('none'),
  publishableKey: z.string().optional(), // write-only
  secretKey: z.string().optional(),      // write-only
  publishableKeyMasked: z.string().optional(),
  hasSecret: z.boolean().default(false),
  testMode: z.boolean().default(true),
})

export const CalendarsIntegrationSchema = z.object({
  googleConnected: z.boolean().default(false),
  outlookConnected: z.boolean().default(false),
})

export const CommsIntegrationSchema = z.object({
  sendgridApiKey: z.string().optional(), // write-only
  sendgridConfigured: z.boolean().default(false),
})

export const AnalyticsIntegrationSchema = z.object({
  gaTrackingId: z.string().optional(), // write-only
  gaTrackingIdMasked: z.string().optional(),
})

export const StorageIntegrationSchema = z.object({
  provider: z.enum(['none','s3','netlify']).default('none'),
  bucket: z.string().optional(),
})

export const IntegrationHubSettingsSchema = z.object({
  payments: PaymentsIntegrationSchema.optional(),
  calendars: CalendarsIntegrationSchema.optional(),
  comms: CommsIntegrationSchema.optional(),
  analytics: AnalyticsIntegrationSchema.optional(),
  storage: StorageIntegrationSchema.optional(),
})

export type IntegrationHubSettings = z.infer<typeof IntegrationHubSettingsSchema>
