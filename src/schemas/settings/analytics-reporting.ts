import { z } from 'zod'

export const DashboardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  widgets: z.array(z.object({ id: z.string().optional(), type: z.string(), config: z.record(z.string(), z.any()) })).default([]),
})

export const MetricSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  label: z.string().min(1),
  aggregation: z.enum(['count','sum','avg','min','max']).default('count'),
  source: z.string().optional(),
})

export const AnalyticsReportingSettingsSchema = z.object({
  dashboards: z.array(DashboardSchema).max(100).default([]),
  metrics: z.array(MetricSchema).max(200).default([]),
  exportsEnabled: z.boolean().default(true),
  dataRetentionDays: z.number().min(1).max(3650).default(365),
  integrations: z.array(z.string()).default([]),
})

export type Dashboard = z.infer<typeof DashboardSchema>
export type Metric = z.infer<typeof MetricSchema>
export type AnalyticsReportingSettings = z.infer<typeof AnalyticsReportingSettingsSchema>
