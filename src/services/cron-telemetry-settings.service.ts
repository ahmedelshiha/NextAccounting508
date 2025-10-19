import prisma from '@/lib/prisma'
import { CronTelemetrySettings, CronTelemetrySettingsSchema } from '@/schemas/settings/cron-telemetry'

const SETTINGS_KEY = 'cron_telemetry_config'

export async function getCronTelemetrySettings(tenantId: string): Promise<CronTelemetrySettings> {
  try {
    const setting = await prisma.orgSetting.findFirst({
      where: { tenantId, key: SETTINGS_KEY },
    })

    if (!setting) {
      return getDefaultSettings()
    }

    const parsed = CronTelemetrySettingsSchema.safeParse(JSON.parse(setting.value))
    return parsed.success ? parsed.data : getDefaultSettings()
  } catch (error) {
    console.error('Error loading cron telemetry settings:', error)
    return getDefaultSettings()
  }
}

export async function updateCronTelemetrySettings(
  tenantId: string,
  updates: Partial<CronTelemetrySettings>
): Promise<CronTelemetrySettings> {
  try {
    const current = await getCronTelemetrySettings(tenantId)
    const merged = { ...current, ...updates }
    const parsed = CronTelemetrySettingsSchema.safeParse(merged)

    if (!parsed.success) {
      throw new Error(`Invalid settings: ${parsed.error.message}`)
    }

    const existing = await prisma.orgSetting.findFirst({
      where: { tenantId, key: SETTINGS_KEY },
    })

    if (existing) {
      await prisma.orgSetting.update({
        where: { id: existing.id },
        data: { value: JSON.stringify(parsed.data) },
      })
    } else {
      await prisma.orgSetting.create({
        data: {
          tenantId,
          key: SETTINGS_KEY,
          value: JSON.stringify(parsed.data),
        },
      })
    }

    return parsed.data
  } catch (error) {
    console.error('Error updating cron telemetry settings:', error)
    throw error
  }
}

export function getDefaultSettings(): CronTelemetrySettings {
  return {
    performance: {
      globalConcurrency: 10,
      tenantConcurrency: 3,
      batchSize: 100,
      processingTimeoutMs: 60000,
    },
    reliability: {
      maxRetries: 3,
      backoffThresholdPercent: 10,
      backoffMultiplier: 2.0,
      minBackoffMs: 500,
      maxBackoffMs: 60000,
    },
    monitoring: {
      enableDetailedLogging: true,
      errorRateAlertThreshold: 5,
      failedCountAlertThreshold: 100,
      enableMetricsCollection: true,
      metricsRetentionDays: 30,
    },
    status: {
      remindersEnabled: true,
      remindersEnabledPerTenant: {},
      maintenanceMode: false,
      maintenanceModeMessage: 'Reminders service is under maintenance',
    },
    scheduling: {
      cronSchedule: '0 9 * * *',
      runTimeWindowHours: 24,
      prioritizeFailedReminders: true,
    },
  }
}
