import { z } from 'zod'

export const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'CLIENT'])
})

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})
