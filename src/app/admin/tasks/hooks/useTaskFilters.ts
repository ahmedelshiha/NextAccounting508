import { useMemo } from 'react'
import { applyFilters } from '@/lib/tasks/utils'

export const useTaskFilters = (tasks: any[], filters: any) => {
  const filteredTasks = useMemo(() => applyFilters(tasks || [], filters || {}), [tasks, filters])
  return { filteredTasks }
}
