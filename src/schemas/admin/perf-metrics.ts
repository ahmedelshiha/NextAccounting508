import { z } from 'zod'

import { z } from 'zod'

// Metrics payload sent from client (admin dashboard)
export const PerfMetricsPostSchema = z.object({
  ts: z.number().int().positive().optional(),
  path: z.string().min(1),
  metrics: z.record(z.string(), z.number().nullable()),
})

// Recent sample as stored in memory
export const PerfMetricsSampleSchema = z.object({
  ts: z.number().int().positive(),
  path: z.string(),
  metrics: z.record(z.string(), z.number().nullable()),
})

// Thresholds used by the API in GET response
export const PerfThresholdsSchema = z.object({
  lcp: z.number(),
  cls: z.number(),
  inp: z.number(),
  ttfb: z.number(),
  fcp: z.number(),
  domInteractive: z.number(),
  load: z.number(),
  uptimeMin: z.number(),
  errorRateMax: z.number(),
})

const TrendSchema = z.object({
  current: z.number(),
  previous: z.number(),
  trend: z.union([z.enum(['up', 'down', 'flat']), z.string()]),
})

export const PerfMetricsGetResponseSchema = z.object({
  pageLoad: TrendSchema,
  apiResponse: TrendSchema,
  uptime: TrendSchema,
  errorRate: TrendSchema,
  thresholds: PerfThresholdsSchema,
  status: z.union([z.enum(['ok', 'alert']), z.string()]),
  alerts: z.array(
    z.object({
      metric: z.string(),
      threshold: z.number(),
      fraction: z.number(),
      count: z.number(),
    })
  ),
  recent: z.array(PerfMetricsSampleSchema),
})

export type PerfMetricsPost = z.infer<typeof PerfMetricsPostSchema>
export type PerfMetricsGetResponse = z.infer<typeof PerfMetricsGetResponseSchema>
