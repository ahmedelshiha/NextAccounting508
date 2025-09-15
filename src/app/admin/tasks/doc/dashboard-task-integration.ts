// hooks/useDashboardTasks.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// Types
interface Task {
  id: string
  title: string
  description?: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'On Hold'
  category: string
  dueDate: string
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  client?: {
    id: string
    name: string
  }
  complianceRequired: boolean
  completionPercentage: number
}

interface TaskStatistics {
  total: number
  overdue: number
  dueToday: number
  completed: number
  inProgress: number
  byPriority: Record<string, number>
  performance: {
    onTimeCompletion: number
    averageTaskAge: number
  }
  recentTasks: Task[]
  urgentTasks: Task[]
}

interface CreateTaskData {
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  category: string
  dueDate: string
  estimatedHours: number
  assigneeId?: string
  clientId?: string
  complianceRequired: boolean
  tags: string[]
}

// Custom hook for dashboard-task integration
export const useDashboardTasks = () => {
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  // Fetch task statistics for dashboard KPIs
  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/tasks/statistics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch task statistics')
      }
      
      const data = await response.json()
      setStatistics(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching task statistics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a new task (for dashboard quick actions)
  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task | null> => {
    try {
      setIsCreating(true)
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const newTask = await response.json()
      
      // Refresh statistics after creating task
      await fetchStatistics()
      
      return newTask
    } catch (err) {
      console.error('Error creating task:', err)
      setError(err instanceof Error ? err.message : 'Failed to create task')
      return null
    } finally {
      setIsCreating(false)
    }
  }, [fetchStatistics])

  // Quick task creation with minimal data
  const createQuickTask = useCallback(async (title: string, priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium'): Promise<void> => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const taskData: CreateTaskData = {
      title,
      description: '',
      priority,
      category: 'General',
      dueDate: tomorrow.toISOString().split('T')[0],
      estimatedHours: 1,
      complianceRequired: false,
      tags: ['quick-task']
    }

    await createTask(taskData)
  }, [createTask])

  // Update task status (for quick status changes from dashboard)
  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      // Refresh statistics after status change
      await fetchStatistics()
      return true
    } catch (err) {
      console.error('Error updating task status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update task')
      return false
    }
  }, [fetchStatistics])

  // Navigation helpers
  const navigateToTaskManager = useCallback(() => {
    router.push('/admin/tasks')
  }, [router])

  const navigateToCreateTask = useCallback(() => {
    router.push('/admin/tasks/new')
  }, [router])

  const navigateToTaskDetails = useCallback((taskId: string) => {
    router.push(`/admin/tasks/${taskId}`)
  }, [router])

  const navigateToTaskAnalytics = useCallback(() => {
    router.push('/admin/tasks/analytics')
  }, [router])

  // Auto-refresh statistics
  useEffect(() => {
    fetchStatistics()

    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(fetchStatistics, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchStatistics])

  // Computed values for dashboard KPIs
  const dashboardMetrics = useMemo(() => {
    if (!statistics) return null

    return {
      // Task completion rate for dashboard KPI
      taskCompletion: {
        current: statistics.completed,
        total: statistics.total,
        percentage: statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 100) : 0,
        trend: statistics.performance.onTimeCompletion // On-time completion as trend indicator
      },

      // Overdue tasks for alerts
      overdueTasks: {
        count: statistics.overdue,
        urgent: statistics.urgentTasks.length,
        priority: 'high' as const,
        hasAlert: statistics.overdue > 0
      },

      // Productivity metrics
      productivity: {
        score: statistics.performance.onTimeCompletion,
        averageAge: statistics.performance.averageTaskAge,
        efficiency: statistics.total > 0 ? Math.round((statistics.inProgress / statistics.total) * 100) : 0
      },

      // Quick actions data
      quickActions: {
        canCreateTask: true,
        hasOverdue: statistics.overdue > 0,
        hasCritical: statistics.byPriority.Critical > 0,
        pendingCount: statistics.total - statistics.completed
      }
    }
  }, [statistics])

  // Recent activity for dashboard feed
  const recentActivity = useMemo(() => {
    if (!statistics?.recentTasks) return []

    return statistics.recentTasks.slice(0, 5).map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      subtitle: task.client?.name || task.category,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee,
      onClick: () => navigateToTaskDetails(task.id)
    }))
  }, [statistics, navigateToTaskDetails])

  // Urgent tasks for dashboard alerts
  const urgentTasks = useMemo(() => {
    if (!statistics?.urgentTasks) return []

    return statistics.urgentTasks.map(task => ({
      id: task.id,
      title: task.title,
      reason: task.priority === 'Critical' ? 'Critical Priority' : 
               task.complianceRequired ? 'Compliance Required' : 'Due Soon',
      dueDate: task.dueDate,
      client: task.client?.name,
      onClick: () => navigateToTaskDetails(task.id)
    }))
  }, [statistics, navigateToTaskDetails])

  return {
    // Data
    statistics,
    dashboardMetrics,
    recentActivity,
    urgentTasks,

    // Loading states
    isLoading,
    isCreating,
    error,

    // Actions
    createTask,
    createQuickTask,
    updateTaskStatus,
    refresh: fetchStatistics,

    // Navigation
    navigateToTaskManager,
    navigateToCreateTask,
    navigateToTaskDetails,
    navigateToTaskAnalytics
  }
}

// Hook for task notifications (integrates with dashboard notification system)
export const useTaskNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'task_overdue' | 'task_assigned' | 'task_completed' | 'compliance_due'
    title: string
    message: string
    priority: 'high' | 'medium' | 'low'
    taskId: string
    timestamp: string
    read: boolean
  }>>([])

  // Mock notifications for demo - replace with real-time updates
  useEffect(() => {
    const mockNotifications = [
      {
        id: '1',
        type: 'task_overdue' as const,
        title: 'Task Overdue',
        message: 'Q3 Tax Return for TechCorp is overdue',
        priority: 'high' as const,
        taskId: '1',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2', 
        type: 'compliance_due' as const,
        title: 'Compliance Deadline',
        message: 'Compliance deadline for TechCorp task in 2 days',
        priority: 'medium' as const,
        taskId: '1',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: false
      }
    ]

    setNotifications(mockNotifications)
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead
  }
}

// Integration component for embedding task widgets in dashboard
export const TaskDashboardWidget = ({ type, className }: { 
  type: 'kpi' | 'activity' | 'urgent' | 'quick-actions'
  className?: string 
}) => {
  const { 
    dashboardMetrics, 
    recentActivity, 
    urgentTasks, 
    isLoading,
    createQuickTask,
    navigateToTaskManager,
    navigateToCreateTask
  } = useDashboardTasks()

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  switch (type) {
    case 'kpi':
      return (
        <div className={`bg-white rounded-lg border p-4 ${className}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Task Completion</h3>
            <span className="text-xs text-gray-500">
              {dashboardMetrics?.taskCompletion.trend}% on-time
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardMetrics?.taskCompletion.percentage}%
          </div>
          <div className="text-xs text-gray-600">
            {dashboardMetrics?.taskCompletion.current} of {dashboardMetrics?.taskCompletion.total} completed
          </div>
        </div>
      )

    case 'activity':
      return (
        <div className={`bg-white rounded-lg border ${className}`}>
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium text-gray-700">Recent Tasks</h3>
          </div>
          <div className="p-2 space-y-1">
            {recentActivity.slice(0, 3).map(activity => (
              <div 
                key={activity.id}
                onClick={activity.onClick}
                className="p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600">{activity.subtitle}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                    activity.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
            <button
              onClick={navigateToTaskManager}
              className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              View all tasks →
            </button>
          </div>
        </div>
      )

    case 'urgent':
      if (!urgentTasks.length) return null
      
      return (
        <div className={`bg-red-50 border border-red-200 rounded-lg ${className}`}>
          <div className="p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">Urgent Tasks</h3>
            <div className="space-y-2">
              {urgentTasks.slice(0, 2).map(task => (
                <div 
                  key={task.id}
                  onClick={task.onClick}
                  className="p-2 bg-white rounded border cursor-pointer hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-red-600">{task.reason}</p>
                      {task.client && (
                        <p className="text-xs text-gray-600">{task.client}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'quick-actions':
      return (
        <div className={`bg-white rounded-lg border p-4 ${className}`}>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={navigateToCreateTask}
              className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
            >
              + Create New Task
            </button>
            <button
              onClick={() => createQuickTask('Review client documents', 'High')}
              className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded border"
            >
              + Quick Review Task
            </button>
            <button
              onClick={navigateToTaskManager}
              className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded border"
            >
              📋 Manage Tasks
            </button>
          </div>
        </div>
      )

    default:
      return null
  }
}