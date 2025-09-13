import { describe, it, expect } from 'vitest'
import { mapUiPriorityToApi, mapApiPriorityToUi, mapUiStatusToApi, mapApiStatusToUi, apiTaskToUiTask } from '../lib/tasks/adapters'

describe('adapters', () => {
  it('maps priorities', () => {
    expect(mapUiPriorityToApi('low' as any)).toBe('LOW')
    expect(mapUiPriorityToApi('medium' as any)).toBe('MEDIUM')
    expect(mapUiPriorityToApi('high' as any)).toBe('HIGH')
    expect(mapUiPriorityToApi('critical' as any)).toBe('HIGH')
    expect(mapApiPriorityToUi('LOW')).toBe('low')
    expect(mapApiPriorityToUi('HIGH')).toBe('high')
  })

  it('maps statuses', () => {
    expect(mapUiStatusToApi('pending' as any)).toBe('OPEN')
    expect(mapUiStatusToApi('in_progress' as any)).toBe('IN_PROGRESS')
    expect(mapUiStatusToApi('review' as any)).toBe('IN_PROGRESS')
    expect(mapUiStatusToApi('blocked' as any)).toBe('IN_PROGRESS')
    expect(mapUiStatusToApi('completed' as any)).toBe('DONE')
    expect(mapApiStatusToUi('OPEN')).toBe('pending')
    expect(mapApiStatusToUi('DONE')).toBe('completed')
  })

  it('converts api task to ui task', () => {
    const apiTask: any = {
      id: '1', title: 'T', dueAt: null, priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: null, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z'
    }
    const ui = apiTaskToUiTask(apiTask)
    expect(ui.id).toBe('1')
    expect(ui.priority).toBe('high')
    expect(ui.status).toBe('in_progress')
    expect(ui.dueDate).toBeTruthy()
  })
})
