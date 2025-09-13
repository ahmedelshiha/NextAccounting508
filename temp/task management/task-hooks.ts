// hooks/tasks/useTasks.ts
import { useState, useEffect, useCallback } from 'react'
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatistics } from '@/lib/tasks/types'
import { calculateTaskStatistics } from '@/lib/tasks/utils'

interface UseTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  statistics: TaskStatistics
  createTask: (task: CreateTaskInput) => Promise<Task | null>
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  bulkUpdateTasks: (ids: string[], updates: UpdateTaskInput) => Promise<boolean>
  refreshTasks: () => Promise<void>
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (taskData: CreateTaskInput): Promise<Task | null> => {
    try {
      setError(null)
      
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      
      const newTask = await response.json()
      setTasks(prev => [newTask, ...prev])
      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      return null
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput): Promise<Task | null> => {
    try {
      setError(null)
      
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === id 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      ))
      
      const response = await fetch(`/api/admin/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task')
        // Revert optimistic update on error
        await fetchTasks()
      }
      
      const updatedTask = await response.json()
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ))
      
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      await fetchTasks() // Refresh on error
      return null
    }
  }, [fetchTasks])

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      // Optimistic update
      setTasks(prev => prev.filter(task => task.id !== id))
      
      const response = await fetch(`/api/admin/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete task')
        // Revert optimistic update on error
        await fetchTasks()
        return false
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      await fetchTasks() // Refresh on error
      return false
    }
  }, [fetchTasks])

  const bulkUpdateTasks = useCallback(async (ids: string[], updates: UpdateTaskInput): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch('/api/admin/tasks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          taskIds: ids,
          updates,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to bulk update tasks')
      }
      
      await fetchTasks() // Refresh after bulk operation
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update tasks')
      return false
    }
  }, [fetchTasks])

  const refreshTasks = useCallback(async () => {
    await fetchTasks()
  }, [fetchTasks])

  // Calculate statistics
  const statistics = calculateTaskStatistics(tasks)

  // Initial load
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    statistics,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    refreshTasks,
  }
}

// hooks/tasks/useTaskFilters.ts
import { useState, useMemo, useCallback } from 'react'
import { Task, TaskFilters, DEFAULT_FILTERS } from '@/lib/tasks/types'
import { applyFilters } from '@/lib/tasks/filtering'

interface UseTaskFiltersReturn {
  filters: TaskFilters
  setFilters: (filters: TaskFilters) => void
  updateFilter: (key: keyof TaskFilters, value: any) => void
  resetFilters: () => void
  filteredTasks: Task[]
  activeFilterCount: number
}

export const useTaskFilters = (tasks: Task[]): UseTaskFiltersReturn => {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)

  const updateFilter = useCallback((key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const filteredTasks = useMemo(() => {
    return applyFilters(tasks, filters)
  }, [tasks, filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.category.length > 0) count++
    if (filters.assignee.length > 0) count++
    if (filters.client.length > 0) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.overdue) count++
    if (filters.compliance) count++
    if (filters.tags.length > 0) count++
    return count
  }, [filters])

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filteredTasks,
    activeFilterCount,
  }
}

// hooks/tasks/useTaskActions.ts
import { useCallback } from 'react'
import { Task, TaskStatus } from '@/lib/tasks/types'

interface UseTaskActionsProps {
  onTaskUpdate: (id: string, updates: any) => Promise<Task | null>
  onTaskDelete: (id: string) => Promise<boolean>
}

interface UseTaskActionsReturn {
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
  markTaskComplete: (taskId: string) => Promise<void>
  assignTask: (taskId: string, assigneeId: string) => Promise<void>
  updateTaskProgress: (taskId: string, percentage: number) => Promise<void>
  duplicateTask: (task: Task) => Task
}

export const useTaskActions = ({ onTaskUpdate, onTaskDelete }: UseTaskActionsProps): UseTaskActionsReturn => {
  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    const updates: any = { 
      status,
      updatedAt: new Date().toISOString()
    }
    
    if (status === 'completed') {
      updates.completionPercentage = 100
      updates.completedAt = new Date().toISOString()
    }
    
    await onTaskUpdate(taskId, updates)
  }, [onTaskUpdate])

  const markTaskComplete = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'completed')
  }, [updateTaskStatus])

  const assignTask = useCallback(async (taskId: string, assigneeId: string) => {
    await onTaskUpdate(taskId, { 
      assigneeId,
      updatedAt: new Date().toISOString()
    })
  }, [onTaskUpdate])

  const updateTaskProgress = useCallback(async (taskId: string, percentage: number) => {
    const status = percentage === 100 ? 'completed' : 'in_progress'
    const updates: any = {
      completionPercentage: percentage,
      status,
      updatedAt: new Date().toISOString()
    }
    
    if (percentage === 100) {
      updates.completedAt = new Date().toISOString()
    }
    
    await onTaskUpdate(taskId, updates)
  }, [onTaskUpdate])

  const duplicateTask = useCallback((task: Task): Task => {
    return {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${task.title} (Copy)`,
      status: 'pending',
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: undefined,
      actualHours: undefined,
      progress: [],
      comments: [],
      attachments: []
    }
  }, [])

  return {
    updateTaskStatus,
    markTaskComplete,
    assignTask,
    updateTaskProgress,
    duplicateTask,
  }
}

// hooks/tasks/useTaskSearch.ts
import { useState, useMemo, useCallback } from 'react'
import { Task } from '@/lib/tasks/types'

interface UseTaskSearchReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: Task[]
  clearSearch: () => void
  isSearching: boolean
}

export const useTaskSearch = (tasks: Task[]): UseTaskSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('')

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks
    }

    const query = searchQuery.toLowerCase().trim()
    
    return tasks.filter(task => {
      // Search in title
      if (task.title.toLowerCase().includes(query)) return true
      
      // Search in description
      if (task.description?.toLowerCase().includes(query)) return true
      
      // Search in assignee name
      if (task.assignee?.name.toLowerCase().includes(query)) return true
      
      // Search in client name
      if (task.client?.name.toLowerCase().includes(query)) return true
      
      // Search in tags
      if (task.tags.some(tag => tag.toLowerCase().includes(query))) return true
      
      // Search in category
      if (task.category.toLowerCase().includes(query)) return true
      
      // Search in status
      if (task.status.toLowerCase().includes(query)) return true
      
      // Search in priority
      if (task.priority.toLowerCase().includes(query)) return true
      
      return false
    })
  }, [tasks, searchQuery])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const isSearching = Boolean(searchQuery.trim())

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    isSearching,
  }
}

// hooks/tasks/useTaskBulkActions.ts
import { useState, useCallback } from 'react'
import { Task, TaskStatus, TaskPriority } from '@/lib/tasks/types'

interface UseTaskBulkActionsReturn {
  selectedTasks: string[]
  selectTask: (taskId: string) => void
  unselectTask: (taskId: string) => void
  selectAllTasks: (taskIds: string[]) => void
  clearSelection: () => void
  bulkUpdateStatus: (status: TaskStatus) => Promise<void>
  bulkUpdatePriority: (priority: TaskPriority) => Promise<void>
  bulkAssign: (assigneeId: string) => Promise<void>
  bulkDelete: () => Promise<void>
  isTaskSelected: (taskId: string) => boolean
  selectedCount: number
}

interface UseTaskBulkActionsProps {
  onBulkUpdate: (ids: string[], updates: any) => Promise<boolean>
  onBulkDelete: (ids: string[]) => Promise<boolean>
}

export const useTaskBulkActions = ({ 
  onBulkUpdate, 
  onBulkDelete 
}: UseTaskBulkActionsProps): UseTaskBulkActionsReturn => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  const selectTask = useCallback((taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev : [...prev, taskId]
    )
  }, [])

  const unselectTask = useCallback((taskId: string) => {
    setSelectedTasks(prev => prev.filter(id => id !== taskId))
  }, [])

  const selectAllTasks = useCallback((taskIds: string[]) => {
    setSelectedTasks(taskIds)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTasks([])
  }, [])

  const bulkUpdateStatus = useCallback(async (status: TaskStatus) => {
    if (selectedTasks.length === 0) return
    
    await onBulkUpdate(selectedTasks, { status })
    clearSelection()
  }, [selectedTasks, onBulkUpdate, clearSelection])

  const bulkUpdatePriority = useCallback(async (priority: TaskPriority) => {
    if (selectedTasks.length === 0) return
    
    await onBulkUpdate(selectedTasks, { priority })
    clearSelection()
  }, [selectedTasks, onBulkUpdate, clearSelection])

  const bulkAssign = useCallback(async (assigneeId: string) => {
    if (selectedTasks.length === 0) return
    
    await onBulkUpdate(selectedTasks, { assigneeId })
    clearSelection()
  }, [selectedTasks, onBulkUpdate, clearSelection])

  const bulkDelete = useCallback(async () => {
    if (selectedTasks.length === 0) return
    
    await onBulkDelete(selectedTasks)
    clearSelection()
  }, [selectedTasks, onBulkDelete, clearSelection])

  const isTaskSelected = useCallback((taskId: string) => {
    return selectedTasks.includes(taskId)
  }, [selectedTasks])

  return {
    selectedTasks,
    selectTask,
    unselectTask,
    selectAllTasks,
    clearSelection,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkAssign,
    bulkDelete,
    isTaskSelected,
    selectedCount: selectedTasks.length,
  }
}