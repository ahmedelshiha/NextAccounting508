'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskProvider, useTasks } from './providers/TaskProvider'
import { FilterProvider, useFilterContext, ViewProvider, useViewContext, NotificationProvider } from './components/providers'
import { TasksHeader, TasksToolbar, TasksStats } from './components/layout'
import { TaskListView } from './components/views/TaskListView'
import { TaskBoardView } from './components/views/TaskBoardView'
import { TaskCalendarView } from './components/views/TaskCalendarView'
import { TaskTableView } from './components/views/TaskTableView'
import { TaskGanttView } from './components/views/TaskGanttView'
import BulkActionsPanel from './components/bulk/BulkActionsPanel'
import ExportPanel from './components/export/ExportPanel'
import TaskEditModal from './components/modals/TaskEditModal'
import TaskDetailsModal from './components/modals/TaskDetailsModal'
import TaskDeleteModal from './components/modals/TaskDeleteModal'
import TaskAnalytics from './components/analytics/TaskAnalytics'
import AdvancedAnalytics from './components/analytics/AdvancedAnalytics'
import TaskFiltersPanel from './components/filters/TaskFiltersPanel'
import type { Task, TaskStatus, SortOption } from '@/lib/tasks/types'
import { sortTasks, calculateTaskStatistics } from '@/lib/tasks/utils'
import { Button } from '@/components/ui/button'

function TasksInner() {
  const router = useRouter()
  const { tasks, loading, error, updateTask, deleteTask, createTask, refresh } = useTasks()
  const { filteredTasks, filters, setFilters } = useFilterContext()
  const { viewMode, setViewMode } = useViewContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showExport, setShowExport] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => { setMounted(true) }, [])
  React.useEffect(() => { setFilters((f: any) => ({ ...f, search: searchQuery })) }, [searchQuery, setFilters])

  const visible = useMemo(() => sortTasks(filteredTasks as Task[], sortBy, true), [filteredTasks, sortBy])
  const stats = useMemo(() => calculateTaskStatistics(visible as Task[]), [visible])

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
      (f.dateRange?.start ? 1 : 0) + (f.dateRange?.end ? 1 : 0),
    ]
    return counts.reduce((a: number, b: number) => a + b, 0)
  }, [filters])

  const onTaskStatusChange = useCallback((id: string, status: TaskStatus) => updateTask(id, { status }), [updateTask])
  const onTaskDelete = useCallback((id: string) => { const t = (visible as Task[]).find(x => x.id === id) || null; setActiveTask(t); setDeleteOpen(true) }, [visible])
  const onTaskView = useCallback((task: Task) => { setActiveTask(task); setDetailsOpen(true) }, [])
  const onTaskEdit = useCallback((task?: Task) => { setActiveTask(task || null); setEditOpen(true) }, [])

  const onTaskSelect = useCallback((taskId: string) => {
    setSelectedIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId])
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeTask) return
    await deleteTask(activeTask.id)
    setActiveTask(null)
    setDeleteOpen(false)
  }, [activeTask, deleteTask])

  const handleSave = useCallback(async (data: any) => {
    if (activeTask) {
      await updateTask(activeTask.id, data)
    } else {
      await createTask(data)
    }
  }, [activeTask, updateTask, createTask])

  return (
    <div className="space-y-6">
      {error && (<div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>)}

      <TasksHeader
        totalTasks={stats.total}
        overdueTasks={stats.overdue}
        completedTasks={stats.completed}
        showBack={true}
        onNewTask={() => { try { router.push('/admin/tasks/new') } catch { onTaskEdit() } }}
        onBulkActions={() => { /* panel appears when items are selected */ }}
        onExport={() => setShowExport(true)}
      />

      <TasksStats stats={stats} />

      <div className="flex items-center justify-between">
        <TasksToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={true}
          onFiltersToggle={() => setShowFiltersPanel(v => !v)}
          filtersActive={filtersActive}
          viewMode={viewMode as any}
          onViewModeChange={(m) => setViewMode(m as any)}
          sortBy={sortBy}
          onSortChange={(s) => setSortBy(s as SortOption)}
        />
      </div>

      {showFiltersPanel && (<TaskFiltersPanel />)}

      {selectedIds.length > 0 && (
        <BulkActionsPanel selectedIds={selectedIds} onClear={() => setSelectedIds([])} onRefresh={refresh} />
      )}

      {viewMode === 'list' && (
        <TaskListView
          tasks={visible as Task[]}
          loading={loading}
          onTaskStatusChange={onTaskStatusChange}
          onTaskDelete={onTaskDelete}
          onTaskEdit={onTaskEdit}
          onTaskView={onTaskView}
          onTaskSelect={onTaskSelect}
          selectedTasks={selectedIds}
        />
      )}

      {viewMode === 'board' && (
        <TaskBoardView
          tasks={visible as Task[]}
          loading={loading}
          onTaskStatusChange={onTaskStatusChange}
          onTaskDelete={onTaskDelete}
          onTaskEdit={onTaskEdit}
          onTaskView={onTaskView}
        />
      )}

      {viewMode === 'calendar' && (
        <TaskCalendarView
          tasks={visible as Task[]}
          loading={loading}
          onTaskEdit={onTaskEdit}
          onTaskView={onTaskView}
          currentDate={calendarDate}
          onDateChange={setCalendarDate}
        />
      )}

      {viewMode === 'table' && (
        <TaskTableView
          tasks={visible as Task[]}
          loading={loading}
          onTaskEdit={onTaskEdit}
          onTaskDelete={(id) => onTaskDelete(id)}
          onTaskStatusChange={onTaskStatusChange}
          onTaskSelect={onTaskSelect}
          selectedTasks={selectedIds}
        />
      )}

      {viewMode === 'gantt' && (
        <TaskGanttView
          tasks={visible as Task[]}
          loading={loading}
          onTaskView={onTaskView}
        />
      )}

      {mounted && <TaskAnalytics />}
      {mounted && <AdvancedAnalytics />}

      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExport(false)} />
          <div className="relative bg-white rounded-lg shadow max-w-3xl w-full p-6 z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Export & Templates</h2>
              <Button variant="ghost" onClick={() => setShowExport(false)}>Close</Button>
            </div>
            <ExportPanel />
          </div>
        </div>
      )}

      <TaskEditModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setActiveTask(null) }}
        task={activeTask || undefined}
        onSave={handleSave}
        availableUsers={[]}
      />

      <TaskDetailsModal
        open={detailsOpen}
        onClose={() => { setDetailsOpen(false); setActiveTask(null) }}
        task={activeTask || undefined}
      />

      <TaskDeleteModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setActiveTask(null) }}
        onConfirm={handleDeleteConfirm}
        task={activeTask || undefined}
      />
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

import { ErrorBoundary } from '@/components/providers/error-boundary'

export default function AdminTasksPage() {
  return (
    <div className="p-6">
      <ErrorBoundary>
        <TaskProvider>
          <TasksContent />
        </TaskProvider>
      </ErrorBoundary>
    </div>
  )
}
