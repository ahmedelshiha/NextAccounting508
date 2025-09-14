import { describe, it, expect } from 'vitest'
import { calculateTaskStatistics, applyFilters, getTaskUrgencyScore } from '@/lib/tasks/utils'
import type { Task } from '@/lib/tasks/types'

const baseTask: Partial<Task> = {
  description: '',
  category: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completionPercentage: 0,
  tags: [],
  collaborators: [],
  createdBy: { id: 'u1', name: 'Admin', email: 'a@example.com', role: 'ADMIN' },
  progress: [],
  dependencies: [],
  reminders: [],
  watchers: []
}

const makeTask = (overrides: Partial<Task>): Task => ({
  id: overrides.id || Math.random().toString(),
  title: overrides.title || 'Task',
  priority: overrides.priority || 'medium',
  status: overrides.status || 'pending',
  category: overrides.category || 'system',
  dueDate: overrides.dueDate || new Date().toISOString(),
  createdAt: overrides.createdAt || baseTask.createdAt!,
  updatedAt: overrides.updatedAt || baseTask.updatedAt!,
  estimatedHours: overrides.estimatedHours ?? 1,
  assignee: overrides.assignee,
  collaborators: overrides.collaborators || [],
  createdBy: overrides.createdBy || baseTask.createdBy!,
  completionPercentage: overrides.completionPercentage ?? 0,
  progress: overrides.progress || [],
  dependencies: overrides.dependencies || [],
  blockedBy: overrides.blockedBy,
  clientId: overrides.clientId,
  client: overrides.client,
  bookingId: overrides.bookingId,
  booking: overrides.booking,
  revenueImpact: overrides.revenueImpact,
  complianceRequired: overrides.complianceRequired ?? false,
  complianceDeadline: overrides.complianceDeadline,
  tags: overrides.tags || [],
  customFields: overrides.customFields || {},
  attachments: overrides.attachments || [],
  comments: overrides.comments || [],
  workflow: overrides.workflow,
  template: overrides.template,
  recurring: overrides.recurring,
  reminders: overrides.reminders || [],
  watchers: overrides.watchers || []
})

describe('task-utils', () => {
  it('calculates stats correctly', () => {
    const tasks: Task[] = [
      makeTask({ id: '1', status: 'completed', priority: 'high', dueDate: new Date().toISOString() }),
      makeTask({ id: '2', status: 'in_progress', priority: 'low', dueDate: new Date().toISOString() }),
      makeTask({ id: '3', status: 'blocked', priority: 'critical', dueDate: new Date(Date.now() - 86400000).toISOString() })
    ]
    const stats = calculateTaskStatistics(tasks)
    expect(stats.total).toBe(3)
    expect(stats.completed).toBe(1)
    expect(stats.inProgress).toBe(1)
    expect(stats.blocked).toBe(1)
    expect(stats.overdue).toBeGreaterThanOrEqual(1)
    expect(stats.byPriority.high + stats.byPriority.low + stats.byPriority.critical).toBe(3)
  })

  it('applies filters', () => {
    const tasks: Task[] = [
      makeTask({ id: '1', status: 'completed', priority: 'high' }),
      makeTask({ id: '2', status: 'in_progress', priority: 'low' })
    ]
    const filtered = applyFilters(tasks, { search: '', status: ['completed'], priority: [], category: [], assignee: [], client: [], dateRange: {}, overdue: false, compliance: false, tags: [] })
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('1')
  })

  it('computes urgency score', () => {
    const t = makeTask({ id: 'x', priority: 'critical', dueDate: new Date(Date.now() - 86400000).toISOString(), complianceRequired: true, completionPercentage: 10 })
    const score = getTaskUrgencyScore(t)
    expect(score).toBeGreaterThan(50)
  })
})
