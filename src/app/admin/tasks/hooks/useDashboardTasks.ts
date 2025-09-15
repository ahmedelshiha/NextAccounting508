"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export type UiPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type UiStatus = 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'On Hold'

interface TaskSummary {
  id: string
  title: string
  description?: string
  priority: UiPriority
  status: UiStatus
  category: string
  dueDate: string
  assignee?: { id: string; name: string; avatar?: string }
  client?: { id: string; name: string }
  complianceRequired: boolean
  completionPercentage: number
}

interface TaskStatisticsResponse {
  total: number
  overdue: number
  dueToday: number
  dueSoon: number
  completed: number
  inProgress: number
  notStarted: number
  byPriority: Record<string, number>
  byAssignee: Record<string, number>
  performance: { onTimeCompletion: number; averageTaskAge: number }
  recentTasks: TaskSummary[]
  urgentTasks: Array<{ id: string; title: string; reason: string; dueDate: string; client?: string }>
}

export function useDashboardTasks() {
  const [statistics, setStatistics] = useState<TaskStatisticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/tasks/statistics')
      if (!res.ok) throw new Error('Failed to fetch task statistics')
      const data = await res.json()
      setStatistics(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatistics() }, [fetchStatistics])

  const createQuickTask = useCallback(async (title: string, priority: UiPriority = 'Medium') => {
    const dueAt = new Date(); dueAt.setDate(dueAt.getDate() + 1)
    const mapPriority = (p: UiPriority) => p === 'Low' ? 'LOW' : (p === 'Medium' ? 'MEDIUM' : 'HIGH')
    const payload = { title, priority: mapPriority(priority), status: 'OPEN', dueAt: dueAt.toISOString() }
    const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) await fetchStatistics()
    return res.ok
  }, [fetchStatistics])

  const updateTaskStatus = useCallback(async (taskId: string, status: UiStatus) => {
    const map = (s: UiStatus) => s === 'Completed' ? 'DONE' : (s === 'In Progress' ? 'IN_PROGRESS' : 'OPEN')
    const res = await apiFetch(`/api/admin/tasks/${taskId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: map(status) }) })
    if (res.ok) await fetchStatistics()
    return res.ok
  }, [fetchStatistics])

  const dashboardMetrics = useMemo(() => {
    if (!statistics) return null
    const percentage = statistics.total ? Math.round((statistics.completed / statistics.total) * 100) : 0
    return {
      taskCompletion: { current: statistics.completed, total: statistics.total, percentage, trend: statistics.performance.onTimeCompletion },
      overdueTasks: { count: statistics.overdue, urgent: statistics.urgentTasks.length, priority: 'high' as const, hasAlert: statistics.overdue > 0 },
      productivity: { score: statistics.performance.onTimeCompletion, averageAge: statistics.performance.averageTaskAge, efficiency: statistics.total ? Math.round((statistics.inProgress / statistics.total) * 100) : 0 },
      quickActions: { canCreateTask: true, hasOverdue: statistics.overdue > 0, hasCritical: (statistics.byPriority['High'] || 0) > 0, pendingCount: statistics.total - statistics.completed },
    }
  }, [statistics])

  return {
    statistics,
    dashboardMetrics,
    recentActivity: statistics?.recentTasks || [],
    urgentTasks: statistics?.urgentTasks || [],
    isLoading,
    error,
    refresh: fetchStatistics,
    createQuickTask,
    updateTaskStatus,
    navigateToTaskManager: () => router.push('/admin/tasks'),
    navigateToCreateTask: () => router.push('/admin/tasks/new'),
  }
}
