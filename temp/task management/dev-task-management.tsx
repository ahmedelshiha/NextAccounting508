'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { TasksHeader, TasksToolbar, TasksStats } from './task-layout-components'
import { TaskListView } from './task-view-components'
import type { Task } from './task-types'
import { calculateTaskStatistics } from './task-utils'
import { useDevTasks } from './hooks/useDevTasks'

export default function DevTaskManagement() {
  const { tasks, loading, error, update } = useDevTasks(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'assignee' | 'category'>('dueDate')
  const [viewMode] = useState<'list' | 'board' | 'calendar' | 'table'>('list')

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const q = searchQuery.toLowerCase()
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assignee?.name.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }, [tasks, searchQuery])

  const statistics = useMemo(() => calculateTaskStatistics(filtered), [filtered])

  const handleTaskStatusChange = useCallback(async (taskId: string, status: Task['status']) => {
    await update(taskId, { status })
  }, [update])

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>
      )}

      <TasksHeader
        totalTasks={statistics.total}
        overdueTasks={statistics.overdue}
        completedTasks={statistics.completed}
        onNewTask={() => {}}
      />

      <TasksStats stats={statistics} />

      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={(s) => setSortBy(s as any)}
        viewMode={viewMode}
        onViewModeChange={() => {}}
        showFilters={false}
      />

      <TaskListView
        tasks={filtered}
        loading={loading}
        onTaskStatusChange={handleTaskStatusChange}
      />
    </div>
  )
}
