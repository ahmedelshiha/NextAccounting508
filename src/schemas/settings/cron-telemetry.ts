import { z } from 'zod'

export const CronTelemetrySettingsSchema = z.object({
  performance: z.object({
    globalConcurrency: z.number().min(1).max(100).default(10),
    tenantConcurrency: z.number().min(1).max(50).default(3),
    batchSize: z.number().min(10).max(1000).default(100),
    processingTimeoutMs: z.number().min(5000).max(300000).default(60000),
  }).optional(),

  reliability: z.object({
    maxRetries: z.number().min(1).max(10).default(3),
    backoffThresholdPercent: z.number().min(1).max(100).default(10),
    backoffMultiplier: z.number().min(1.0).max(10.0).default(2.0),
    minBackoffMs: z.number().min(100).max(10000).default(500),
    maxBackoffMs: z.number().min(1000).max(300000).default(60000),
  }).optional(),

  monitoring: z.object({
    enableDetailedLogging: z.boolean().default(true),
    errorRateAlertThreshold: z.number().min(0.1).max(50).default(5),
    failedCountAlertThreshold: z.number().min(1).max(10000).default(100),
    enableMetricsCollection: z.boolean().default(true),
    metricsRetentionDays: z.number().min(7).max(365).default(30),
  }).optional(),

  status: z.object({
    remindersEnabled: z.boolean().default(true),
    remindersEnabledPerTenant: z.record(z.string(), z.boolean()).default({}),
    maintenanceMode: z.boolean().default(false),
    maintenanceModeMessage: z.string().default('Reminders service is under maintenance'),
  }).optional(),

  scheduling: z.object({
    cronSchedule: z.string().default('0 9 * * *'),
    runTimeWindowHours: z.number().min(1).max(24).default(24),
    prioritizeFailedReminders: z.boolean().default(true),
  }).optional(),
})

export type CronTelemetrySettings = z.infer<typeof CronTelemetrySettingsSchema>
