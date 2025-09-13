import { useMemo } from 'react'
import { applyFilters } from '../task-utils'

export const useTaskFilters = (tasks: any[], filters: any) => {
  const filteredTasks = useMemo(() => applyFilters(tasks || [], filters || {}), [tasks, filters])
  return { filteredTasks }
}
