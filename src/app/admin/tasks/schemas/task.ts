import { z } from 'zod'

import { z as zod } from 'zod'

export const TaskFormSchema = zod.object({
  title: zod.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: zod.string().optional(),
  priority: zod.enum(['low','medium','high','critical']).default('medium'),
  dueDate: zod.string().optional().nullable(),
  assigneeId: zod.string().optional().nullable(),
})

export type TaskFormValues = z.infer<typeof TaskFormSchema>
