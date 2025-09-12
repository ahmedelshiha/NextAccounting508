import { describe, it, expect } from 'vitest'
import { priorityFromApi, statusFromApi, mapApiToUi } from '../src/app/admin/tasks/utils'

describe('task utils', () => {
  it('maps priority correctly', () => {
    expect(priorityFromApi('HIGH')).toBe('high')
    expect(priorityFromApi('LOW')).toBe('low')
    expect(priorityFromApi('MEDIUM')).toBe('medium')
    expect(priorityFromApi(undefined)).toBe('medium')
  })

  it('maps status correctly', () => {
    expect(statusFromApi('DONE')).toBe('completed')
    expect(statusFromApi('IN_PROGRESS')).toBe('in_progress')
    expect(statusFromApi('OPEN')).toBe('pending')
    expect(statusFromApi(undefined)).toBe('pending')
  })

  it('maps api task to ui task', () => {
    const api = { id: 't1', title: 'Task 1', dueAt: '2025-01-01T00:00:00Z', priority: 'HIGH', status: 'IN_PROGRESS' }
    const ui = mapApiToUi(api as any)
    expect(ui.id).toBe('t1')
    expect(ui.title).toBe('Task 1')
    expect(ui.priority).toBe('high')
    expect(ui.status).toBe('in_progress')
    expect(ui.completionPercentage).toBe(0)
  })
})
