'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { TaskProvider, useTasks } from './providers/TaskProvider'
import { FilterProvider, useFilterContext, ViewProvider, useViewContext, NotificationProvider } from './components/providers'
import { TasksToolbar } from './components/layout'
import { TaskListView } from './components/views/TaskListView'
import { TaskBoardView } from './components/views/TaskBoardView'
import type { Task, TaskStatus, SortOption } from '@/lib/tasks/types'
import { sortTasks } from '@/lib/tasks/utils'

function TasksInner() {
  const { tasks, loading, error, updateTask, deleteTask } = useTasks()
  const { filteredTasks, filters, setFilters } = useFilterContext()
  const { viewMode, setViewMode } = useViewContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')

  // keep FilterProvider search in sync with toolbar input
  React.useEffect(() => { setFilters((f: any) => ({ ...f, search: searchQuery })) }, [searchQuery, setFilters])

  const visible = useMemo(() => sortTasks(filteredTasks as Task[], sortBy, true), [filteredTasks, sortBy])

  const filtersActive = useMemo(() => {
    const f = filters || {}
    const counts = [
      (f.status?.length || 0),
      (f.priority?.length || 0),
      (f.category?.length || 0),
      (f.assignee?.length || 0),
      (f.client?.length || 0),
      (f.tags?.length || 0),
      f.overdue ? 1 : 0,
      f.compliance ? 1 : 0,
      (f.dateRange?.start ? 1 : 0) + (f.dateRange?.end ? 1 : 0)
    ]
    return counts.reduce((a: number, b: number) => a + b, 0)
  }, [filters])

  const onTaskStatusChange = useCallback((id: string, status: TaskStatus) => updateTask(id, { status }), [updateTask])
  const onTaskDelete = useCallback((id: string) => deleteTask(id), [deleteTask])

  return (
    <div className="space-y-6">
      {error && (<div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>)}
      <div className="flex items-center justify-between">
        <TasksToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={true}
          onFiltersToggle={() => { /* future: open filters panel */ }}
          filtersActive={filtersActive}
          viewMode={viewMode as any}
          onViewModeChange={(m) => setViewMode(m as any)}
          sortBy={sortBy}
          onSortChange={(s) => setSortBy(s as SortOption)}
        />
        <a href="/admin/tasks/new" className="ml-4"><button className="inline-flex items-center rounded-md border px-3 py-2 text-sm">New Task</button></a>
      </div>

      {viewMode === 'list' && (
        <TaskListView tasks={visible as Task[]} loading={loading} onTaskStatusChange={onTaskStatusChange} onTaskDelete={onTaskDelete} />
      )}
      {viewMode === 'board' && (
        <TaskBoardView tasks={visible as Task[]} loading={loading} onTaskStatusChange={onTaskStatusChange} onTaskDelete={onTaskDelete} />
      )}
    </div>
  )
}

function TasksContent() {
  const { tasks } = useTasks()
  return (
    <NotificationProvider>
      <ViewProvider>
        <FilterProvider tasks={tasks}>
          <TasksInner />
        </FilterProvider>
      </ViewProvider>
    </NotificationProvider>
  )
}

export default function AdminTasksPage() {
  return (
    <div className="p-6">
      <TaskProvider>
        <TasksContent />
      </TaskProvider>
    </div>
  )
}
