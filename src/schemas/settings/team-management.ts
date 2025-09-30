import { z } from 'zod'

export const TeamStructureSchema = z.object({
  orgUnits: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    parentId: z.string().nullable().optional(),
    leadUserId: z.string().nullable().optional(),
  })).max(200).default([]),
})

export const TeamAvailabilitySchema = z.object({
  defaultWorkingHours: z.object({
    start: z.string().default('09:00'),
    end: z.string().default('17:00'),
    timezone: z.string().default('UTC'),
  }).optional(),
  allowFlexibleHours: z.boolean().default(false),
  minimumHoursNotice: z.number().min(0).default(24),
})

export const TeamSkillsSchema = z.object({
  skills: z.array(z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    weight: z.number().min(0).max(100).default(50),
  })).max(500).default([]),
})

export const TeamWorkloadSchema = z.object({
  autoAssignStrategy: z.enum(['ROUND_ROBIN','LEAST_WORKLOAD','SKILL_MATCH','MANUAL']).default('ROUND_ROBIN'),
  maxConcurrentAssignments: z.number().min(1).max(100).default(5),
  considerAvailability: z.boolean().default(true),
})

export const TeamPerformanceSchema = z.object({
  enableMetrics: z.boolean().default(true),
  metricsWindowDays: z.number().min(1).max(365).default(30),
})

export const TeamSettingsSchema = z.object({
  structure: TeamStructureSchema.default({ orgUnits: [] }),
  availability: TeamAvailabilitySchema.default({ allowFlexibleHours: false, minimumHoursNotice: 24 }),
  skills: TeamSkillsSchema.default({ skills: [] }),
  workload: TeamWorkloadSchema.default({ autoAssignStrategy: 'ROUND_ROBIN', maxConcurrentAssignments: 5, considerAvailability: true }),
  performance: TeamPerformanceSchema.default({ enableMetrics: true, metricsWindowDays: 30 }),
})

export type TeamStructure = z.infer<typeof TeamStructureSchema>
export type TeamAvailability = z.infer<typeof TeamAvailabilitySchema>
export type TeamSkills = z.infer<typeof TeamSkillsSchema>
export type TeamWorkload = z.infer<typeof TeamWorkloadSchema>
export type TeamPerformance = z.infer<typeof TeamPerformanceSchema>
export type TeamSettings = z.infer<typeof TeamSettingsSchema>
