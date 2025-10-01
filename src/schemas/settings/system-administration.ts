import { z } from 'zod'

export const SystemBackupSchema = z.object({
  enabled: z.boolean().default(false),
  retentionDays: z.number().int().min(1).max(3650).default(30),
})

export const SystemImpersonationSchema = z.object({
  enabled: z.boolean().default(false),
  allowedRoles: z.array(z.string()).min(1).default(['ADMIN']),
})

export const SystemSessionSchema = z.object({
  maxSessionMinutes: z.number().int().min(5).max(7 * 24 * 60).default(1440),
  singleSession: z.boolean().default(false),
})

export const SystemAdministrationSettingsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  readOnlyMode: z.boolean().default(false),
  featureFlags: z.record(z.boolean()).default({}),
  backup: SystemBackupSchema.default({ enabled: false, retentionDays: 30 }),
  impersonation: SystemImpersonationSchema.default({ enabled: false, allowedRoles: ['ADMIN'] }),
  session: SystemSessionSchema.default({ maxSessionMinutes: 1440, singleSession: false }),
})

export type SystemAdministrationSettings = z.infer<typeof SystemAdministrationSettingsSchema>
