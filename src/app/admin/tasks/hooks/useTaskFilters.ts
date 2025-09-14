import { applyFilters } from '@/lib/tasks/utils'
import type { Task, TaskFilters } from '@/lib/tasks/types'
import { useMemo } from 'react'

export const useTaskFilters = (tasks: Task[], filters: TaskFilters) => {
  const filteredTasks = useMemo(() => applyFilters(tasks || [], filters), [tasks, filters])
  return { filteredTasks }
}
