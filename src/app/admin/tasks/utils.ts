'use client'

import type { TaskItem, Task } from './types'

export function priorityFromApi(p?: string) {
  if (!p) return 'medium'
  return p === 'HIGH' ? 'high' : p === 'LOW' ? 'low' : 'medium'
}

export function statusFromApi(s?: string) {
  if (!s) return 'pending'
  return s === 'DONE' ? 'completed' : s === 'IN_PROGRESS' ? 'in_progress' : 'pending'
}

export function mapApiToUi(t: TaskItem): Task {
  return {
    id: t.id,
    title: t.title,
    priority: priorityFromApi(t.priority),
    dueDate: t.dueAt ? String(t.dueAt) : new Date().toISOString(),
    status: statusFromApi(t.status),
    category: 'system',
    estimatedHours: 0,
    completionPercentage: t.status === 'DONE' ? 100 : 0,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
    complianceRequired: false,
  } as Task
}
