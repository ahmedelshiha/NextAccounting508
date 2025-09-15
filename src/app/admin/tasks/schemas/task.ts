import { z } from 'zod'

export const TaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low','medium','high','critical']).default('medium'),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

export type TaskFormValues = z.infer<typeof TaskFormSchema>
