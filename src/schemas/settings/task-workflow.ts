import { z } from 'zod'

export const TaskTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  defaultAssigneeRole: z.string().optional(),
  defaultPriority: z.enum(['low','medium','high']).default('medium'),
})

export const TaskStatusSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  label: z.string().min(1),
  color: z.string().optional(),
  order: z.number().min(0).default(0),
  isClosed: z.boolean().default(false),
})

export const TaskAutomationRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  trigger: z.string().min(1),
  condition: z.string().optional(),
  actions: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
})

export const TaskBoardSchema = z.object({
  swimlanes: z.array(z.object({ id: z.string().optional(), title: z.string().min(1), query: z.string().optional() })).max(50).default([]),
  showCompletedInBoard: z.boolean().default(false),
})

export const TaskWorkflowSettingsSchema = z.object({
  templates: z.array(TaskTemplateSchema).max(200).default([]),
  statuses: z.array(TaskStatusSchema).max(50).default([]),
  automation: z.array(TaskAutomationRuleSchema).max(200).default([]),
  board: TaskBoardSchema.default({}),
  dependenciesEnabled: z.boolean().default(true),
})

export type TaskTemplate = z.infer<typeof TaskTemplateSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type TaskAutomationRule = z.infer<typeof TaskAutomationRuleSchema>
export type TaskBoard = z.infer<typeof TaskBoardSchema>
export type TaskWorkflowSettings = z.infer<typeof TaskWorkflowSettingsSchema>
