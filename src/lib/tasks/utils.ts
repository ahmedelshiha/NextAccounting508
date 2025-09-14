// lib/tasks/utils.ts
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskCategory,
  TaskStatistics,
  TaskFilters,
  SortOption,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_CATEGORIES
} from './types'

export const getPriorityColor = (priority: TaskPriority): string => {
  return TASK_PRIORITIES.find(p => p.value === priority)?.color || 'text-gray-600 bg-gray-50 border-gray-200'
}

export const getStatusColor = (status: TaskStatus): string => {
  return TASK_STATUSES.find(s => s.value === status)?.color || 'text-gray-600 bg-gray-50'
}

export const getCategoryIcon = (category: TaskCategory): string => {
  return TASK_CATEGORIES.find(c => c.value === category)?.icon || 'FileText'
}

export const isOverdue = (dueDate: string, status: TaskStatus): boolean => {
  if (status === 'completed') return false
  return new Date(dueDate) < new Date()
}

export const isDueToday = (dueDate: string): boolean => {
  const today = new Date()
  const due = new Date(dueDate)
  return today.toDateString() === due.toDateString()
}

export const isDueSoon = (dueDate: string, daysAhead: number = 3): boolean => {
  const future = new Date()
  future.setDate(future.getDate() + daysAhead)
  const due = new Date(dueDate)
  return due <= future && due > new Date()
}

export const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return date.toLocaleDateString()
  }
}

export const getProgressColor = (percentage: number): string => {
  if (percentage === 100) return 'bg-green-500'
  if (percentage > 75) return 'bg-blue-500'
  if (percentage > 50) return 'bg-yellow-500'
  if (percentage > 25) return 'bg-orange-500'
  return 'bg-red-500'
}

export const calculateTaskStatistics = (tasks: Task[]): TaskStatistics => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const stats: TaskStatistics = {
    total: tasks.length,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    byCategory: { booking: 0, client: 0, system: 0, finance: 0, compliance: 0, marketing: 0 },
    byAssignee: {},
    productivity: 0,
    averageCompletionTime: 0,
    complianceRate: 0
  }
  
  let totalCompletionTime = 0
  let completedTasksWithTime = 0
  let complianceTasksCompleted = 0
  let totalComplianceTasks = 0
  
  tasks.forEach(task => {
    const dueDate = new Date(task.dueDate)
    
    // Basic counts
    if (isOverdue(task.dueDate, task.status)) stats.overdue++
    if (isDueToday(task.dueDate)) stats.dueToday++
    if (isDueSoon(task.dueDate)) stats.dueSoon++
    if (task.status === 'completed') stats.completed++
    if (task.status === 'in_progress') stats.inProgress++
    if (task.status === 'blocked') stats.blocked++
    
    // By priority
    stats.byPriority[task.priority]++
    
    // By category
    stats.byCategory[task.category]++
    
    // By assignee
    if (task.assignee) {
      const assigneeName = task.assignee.name
      stats.byAssignee[assigneeName] = (stats.byAssignee[assigneeName] || 0) + 1
    }
    
    // Completion time calculation
    if (task.status === 'completed' && task.completedAt) {
      const created = new Date(task.createdAt)
      const completed = new Date(task.completedAt)
      const completionTime = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      totalCompletionTime += completionTime
      completedTasksWithTime++
    }
    
    // Compliance tracking
    if (task.complianceRequired) {
      totalComplianceTasks++
      if (task.status === 'completed') {
        complianceTasksCompleted++
      }
    }
  })
  
  // Calculate derived metrics
  stats.productivity = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  stats.averageCompletionTime = completedTasksWithTime > 0 ? Math.round(totalCompletionTime / completedTasksWithTime) : 0
  stats.complianceRate = totalComplianceTasks > 0 ? Math.round((complianceTasksCompleted / totalComplianceTasks) * 100) : 100
  
  return stats
}

export const getTaskUrgencyScore = (task: Task): number => {
  let score = 0
  
  // Priority weight
  const priorityWeights = { low: 1, medium: 2, high: 3, critical: 4 }
  score += priorityWeights[task.priority] * 25
  
  // Due date weight
  const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilDue < 0) score += 50 // Overdue
  else if (daysUntilDue === 0) score += 40 // Due today
  else if (daysUntilDue <= 3) score += 30 // Due soon
  else if (daysUntilDue <= 7) score += 15 // Due this week
  
  // Compliance weight
  if (task.complianceRequired) score += 20
  
  // Revenue impact weight
  if (task.revenueImpact && task.revenueImpact > 1000) score += 15
  
  // Completion percentage (inverse weight)
  score -= Math.floor(task.completionPercentage / 10)
  
  return Math.max(0, score)
}

export const groupTasksByStatus = (tasks: Task[]): Record<TaskStatus, Task[]> => {
  return tasks.reduce((groups, task) => {
    if (!groups[task.status]) {
      groups[task.status] = []
    }
    groups[task.status].push(task)
    return groups
  }, {} as Record<TaskStatus, Task[]>)
}

export const groupTasksByAssignee = (tasks: Task[]): Record<string, Task[]> => {
  return tasks.reduce((groups, task) => {
    const assigneeName = task.assignee?.name || 'Unassigned'
    if (!groups[assigneeName]) {
      groups[assigneeName] = []
    }
    groups[assigneeName].push(task)
    return groups
  }, {} as Record<string, Task[]>)
}

export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// lib/tasks/filtering.ts
// types are already imported above

export const applyFilters = (tasks: Task[], filters: TaskFilters): Task[] => {
  return tasks.filter(task => {
    // Search filter
    if (filters.search && !matchesSearch(task, filters.search)) {
      return false
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false
    }
    
    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false
    }
    
    // Category filter
    if (filters.category.length > 0 && !filters.category.includes(task.category)) {
      return false
    }
    
    // Assignee filter
    if (filters.assignee.length > 0 && task.assignee && !filters.assignee.includes(task.assignee.id)) {
      return false
    }
    
    // Client filter
    if (filters.client.length > 0 && task.clientId && !filters.client.includes(task.clientId)) {
      return false
    }
    
    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const taskDate = new Date(task.dueDate)
      if (filters.dateRange.start && taskDate < new Date(filters.dateRange.start)) {
        return false
      }
      if (filters.dateRange.end && taskDate > new Date(filters.dateRange.end)) {
        return false
      }
    }
    
    // Overdue filter
    if (filters.overdue && !isOverdue(task.dueDate, task.status)) {
      return false
    }
    
    // Compliance filter
    if (filters.compliance && !task.complianceRequired) {
      return false
    }
    
    // Tags filter
    if (filters.tags.length > 0 && !filters.tags.some(tag => task.tags.includes(tag))) {
      return false
    }
    
    return true
  })
}

const matchesSearch = (task: Task, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase()
  return (
    task.title.toLowerCase().includes(term) ||
    task.description?.toLowerCase().includes(term) ||
    task.tags.some(tag => tag.toLowerCase().includes(term)) ||
    task.assignee?.name?.toLowerCase().includes(term) ||
    task.client?.name?.toLowerCase().includes(term)
  )
}

// lib/tasks/sorting.ts
// types are already imported above

export const sortTasks = (tasks: Task[], sortBy: SortOption, ascending: boolean = true): Task[] => {
  return [...tasks].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
        
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
        comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        break
        
      case 'status':
        const statusOrder = { pending: 1, in_progress: 2, review: 3, blocked: 4, completed: 5 }
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
        break
        
      case 'assignee':
        const aAssignee = a.assignee?.name || 'ZZZ_Unassigned'
        const bAssignee = b.assignee?.name || 'ZZZ_Unassigned'
        comparison = aAssignee.localeCompare(bAssignee)
        break
        
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
        
      default:
        comparison = 0
    }
    
    return ascending ? comparison : -comparison
  })
}
