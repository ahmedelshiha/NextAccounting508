import React, { createContext, useContext, useState, useMemo } from 'react'
import type { TaskFilters } from '../../task-types'
import { applyFilters } from '../../task-utils'

const defaultFilters: TaskFilters = { search: '', status: [], priority: [], category: [], assignee: [], client: [], dateRange: {}, overdue: false, compliance: false, tags: [] }
const FilterContext = createContext<any>(null)

export const FilterProvider = ({ children, tasks }: { children: React.ReactNode; tasks: any[] }) => {
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)
  const resetFilters = () => setFilters(defaultFilters)

  const filteredTasks = useMemo(() => applyFilters(tasks || [], filters), [tasks, filters])

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters, filteredTasks }}>{children}</FilterContext.Provider>
  )
}

export const useFilterContext = () => useContext(FilterContext)
