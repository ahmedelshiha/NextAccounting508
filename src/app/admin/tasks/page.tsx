'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Grid3X3,
  List,
  Calendar,
  Table,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Activity,
} from 'lucide-react'

import dynamic from 'next/dynamic'

// Core Providers
import { TaskProvider, useTasks } from './providers/TaskProvider'
import {
  FilterProvider,
  useFilterContext,
  ViewProvider,
  useViewContext,
  NotificationProvider,
} from './components/providers'

// Templates / Layout
import StandardPage from '@/components/dashboard/templates/StandardPage'

// View Components
import { TaskListView } from './components/views/TaskListView'
import { TaskBoardView } from './components/views/TaskBoardView'
import { TaskCalendarView } from './components/views/TaskCalendarView'
import { TaskTableView } from './components/views/TaskTableView'
import { TaskGanttView } from './components/views/TaskGanttView'

// Action Components
import BulkActionsPanel from './components/bulk/BulkActionsPanel'
import TaskFiltersPanel from './components/filters/TaskFiltersPanel'

// Modal Components
import TaskEditModal from './components/modals/TaskEditModal'
import TaskDetailsModal from './components/modals/TaskDetailsModal'
import TaskDeleteModal from './components/modals/TaskDeleteModal'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Types and Utils
import type { Task, TaskStatus, SortOption } from '@/lib/tasks/types'
import { sortTasks, calculateTaskStatistics } from '@/lib/tasks/utils'
import { ErrorBoundary } from '@/components/providers/error-boundary'

const TaskAnalytics = dynamic(() => import('./components/analytics/TaskAnalytics'), { ssr: false })
const AdvancedAnalytics = dynamic(() => import('./components/analytics/AdvancedAnalytics'), { ssr: false })
const ExportPanel = dynamic(() => import('./components/export/ExportPanel'), { ssr: false })

// Predefined width classes (ensures Tailwind picks these up statically)
const WIDTH_CLASSES = {
  0: 'w-[0%]',
  10: 'w-[10%]',
  20: 'w-[20%]',
  30: 'w-[30%]',
  40: 'w-[40%]',
  50: 'w-[50%]',
  60: 'w-[60%]',
  70: 'w-[70%]',
  80: 'w-[80%]',
  90: 'w-[90%]',
  100: 'w-[100%]',
} as const

function trendWidthClass(n?: number) {
  const raw = Math.round(((n || 0) * 10)) * 10
  const clamped = Math.max(0, Math.min(100, raw)) as keyof typeof WIDTH_CLASSES
  return WIDTH_CLASSES[clamped]
}

// Enhanced Quick Stats Card Component
function QuickStatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  trend?: number[]
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {change && (
                <div className="flex items-center space-x-1">
                  <span
                    className={`text-sm font-medium ${
                      changeType === 'positive'
                        ? 'text-green-600'
                        : changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {change}
                  </span>
                  <span className="text-xs text-gray-500">vs last week</span>
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-xl ${
                changeType === 'positive' ? 'bg-green-100' : changeType === 'negative' ? 'bg-red-100' : 'bg-blue-100'
              } group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon
                className={`h-6 w-6 ${
                  changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-blue-600'
                }`}
              />
            </div>
          </div>
          {trend && (
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`${
                  changeType === 'positive' ? 'bg-green-500' : changeType === 'negative' ? 'bg-red-500' : 'bg-blue-500'
                } ${trendWidthClass(trend[0])} h-full rounded-full transition-all duration-1000`}
              />
            </div>
          )}
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full" />
      </Card>
    </motion.div>
  )
}

// Enhanced View Mode Switcher
function ViewModeSwitcher({ currentView, onViewChange }: { currentView: string; onViewChange: (view: string) => void }) {
  const views = [
    { id: 'board', label: 'Board', icon: Grid3X3 },
    { id: 'list', label: 'List', icon: List },
    { id: 'table', label: 'Table', icon: Table },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'gantt', label: 'Gantt', icon: BarChart3 },
  ]

  return (
    <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = currentView === view.id
        return (
          <Button
            key={view.id}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(view.id)}
            className={`relative flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
              isActive ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline-block text-xs font-medium">{view.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeView"
                className="absolute inset-0 bg-blue-600 rounded-md -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Button>
        )
      })}
    </div>
  )
}

// Main Inner Component
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
  const [showAnalytics, setShowAnalytics] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    setFilters((f: any) => ({ ...f, search: searchQuery }))
  }, [searchQuery, setFilters])

  const visible = useMemo(() => sortTasks(filteredTasks as Task[], sortBy, true), [filteredTasks, sortBy])

  const stats = useMemo(() => calculateTaskStatistics(visible as Task[]), [visible])

  const filtersActive = useMemo(() => {
    const f = filters || {}
    const counts = [
      f.status?.length || 0,
      f.priority?.length || 0,
      f.category?.length || 0,
      f.assignee?.length || 0,
      f.client?.length || 0,
      f.tags?.length || 0,
      f.overdue ? 1 : 0,
      f.compliance ? 1 : 0,
      (f.dateRange?.start ? 1 : 0) + (f.dateRange?.end ? 1 : 0),
    ]
    return counts.reduce((a: number, b: number) => a + b, 0)
  }, [filters])

  // Event Handlers
  const onTaskStatusChange = useCallback((id: string, status: TaskStatus) => updateTask(id, { status }), [updateTask])

  const onTaskDelete = useCallback(
    (id: string) => {
      const t = (visible as Task[]).find((x) => x.id === id) || null
      setActiveTask(t)
      setDeleteOpen(true)
    },
    [visible],
  )

  const onTaskView = useCallback((task: Task) => {
    setActiveTask(task)
    setDetailsOpen(true)
  }, [])

  const onTaskEdit = useCallback((task?: Task) => {
    setActiveTask(task || null)
    setEditOpen(true)
  }, [])

  const onTaskSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeTask) return
    await deleteTask(activeTask.id)
    setActiveTask(null)
    setDeleteOpen(false)
  }, [activeTask, deleteTask])

  const handleSave = useCallback(
    async (data: any) => {
      if (activeTask) {
        const updated = await updateTask(activeTask.id, data)
        if (!updated) throw new Error('Failed to update task')
      } else {
        const created = await createTask(data)
        if (!created) throw new Error('Failed to create task')
      }
    },
    [activeTask, updateTask, createTask],
  )

  const handleNewTask = useCallback(() => {
    try {
      router.push('/admin/tasks/new')
    } catch {
      onTaskEdit()
    }
  }, [router, onTaskEdit])

  return (
    <StandardPage
      title="Task Management"
      subtitle="Organize, track, and manage your team's work efficiently"
      primaryAction={{ label: 'New Task', icon: <Plus className="h-4 w-4" />, onClick: handleNewTask }}
      secondaryActions={[{ label: 'Analytics', icon: <Activity className="h-4 w-4" />, onClick: () => setShowAnalytics(true) }]}
      error={error || null}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QuickStatsCard title="Total Tasks" value={stats.total} change="+12%" changeType="positive" icon={Target} trend={[stats.total]} />
        <QuickStatsCard title="In Progress" value={stats.inProgress || 0} change="+8%" changeType="positive" icon={Clock} trend={[stats.inProgress]} />
        <QuickStatsCard title="Completed" value={stats.completed} change="+15%" changeType="positive" icon={CheckCircle2} trend={[stats.completed]} />
        <QuickStatsCard
          title="Overdue"
          value={stats.overdue}
          change={stats.overdue > 0 ? '-5%' : '0%'}
          changeType={stats.overdue > 0 ? 'negative' : 'neutral'}
          icon={AlertTriangle}
          trend={[stats.overdue]}
        />
      </div>

      {/* Toolbar Section */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`flex items-center space-x-2 ${filtersActive > 0 ? 'border-blue-500 bg-blue-50 text-blue-600' : ''}`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {filtersActive > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-blue-600 text-white">
                    {filtersActive}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Switcher */}
              <ViewModeSwitcher currentView={viewMode as string} onViewChange={setViewMode} />

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowExport(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={refresh}>
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAnalytics(true)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <TaskFiltersPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
            <BulkActionsPanel selectedIds={selectedIds} onClear={clearSelection} onRefresh={refresh} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={viewMode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
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
                onTaskDelete={onTaskDelete}
                onTaskStatusChange={onTaskStatusChange}
                onTaskSelect={onTaskSelect}
                selectedTasks={selectedIds}
              />
            )}

            {viewMode === 'gantt' && <TaskGanttView tasks={visible as Task[]} loading={loading} onTaskView={onTaskView} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Analytics Section */}
      {mounted && showAnalytics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-0 pb-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <TaskAnalytics />
            </TabsContent>
            <TabsContent value="advanced">
              <AdvancedAnalytics />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowExport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Export & Templates</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowExport(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <ExportPanel />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <TaskEditModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setActiveTask(null)
        }}
        task={activeTask || undefined}
        onSave={handleSave}
        availableUsers={[]}
      />

      <TaskDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setActiveTask(null)
        }}
        task={activeTask || undefined}
      />

      <TaskDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setActiveTask(null)
        }}
        onConfirm={handleDeleteConfirm}
        task={activeTask || undefined}
      />
    </StandardPage>
  )
}

// Task Content Wrapper
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

// Main Export Component
export default function AdminTasksPage() {
  return (
    <ErrorBoundary>
      <TaskProvider>
        <TasksContent />
      </TaskProvider>
    </ErrorBoundary>
  )
}
