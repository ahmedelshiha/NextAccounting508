'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Plus,
  Filter,
  Search,
  Eye,
  Flag,
  Target,
  BarChart3,
  DollarSign,
  AlertTriangle,
  FileText,
  TrendingUp,
  Settings,
} from 'lucide-react'
import VirtualizedTaskList from './virtualized-task-list'
import BoardView from './board-view'
import TaskEditDialog from './task-edit-dialog'

interface TaskItem {
  id: string
  title: string
  dueAt: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | string
  assigneeId?: string | null
  createdAt?: string
  updatedAt?: string
}

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'DONE'

type SortBy = 'createdAt' | 'dueAt' | 'priority' | 'status' | 'title'

type CreateForm = { title: string; dueAt: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; notes: string }

type UpdatePayload = Partial<Pick<TaskItem, 'title' | 'dueAt' | 'priority' | 'status'>>

export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
export type Category = 'booking' | 'client' | 'system' | 'finance' | 'compliance' | 'marketing'

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate: string
  assignee?: string
  assigneeAvatar?: string
  status: TaskStatus
  category: Category
  estimatedHours: number
  actualHours?: number
  completionPercentage: number
  dependencies?: string[]
  clientId?: string
  bookingId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  tags?: string[]
  revenueImpact?: number
  complianceRequired: boolean
}

interface TaskManagementProps {
  initialTasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void> | void
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void
  onTaskDelete?: (taskId: string) => Promise<void> | void
  onSearch?: (q: string) => void
}

function TaskManagementSystem({ initialTasks = [], onTaskUpdate, onTaskCreate, onSearch }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filters, setFilters] = useState<{ status: string; priority: string; category: string; assignee: string; search: string }>({ status: 'all', priority: 'all', category: 'all', assignee: 'all', search: '' })
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'assignee'>('dueDate')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<{ title: string; dueDate: string; priority: Priority }>({ title: '', dueDate: '', priority: 'medium' })
  const assigneeOptions = useMemo(() => {
    const s = new Set<string>()
    for (const t of tasks) if (t.assignee) s.add(t.assignee)
    return Array.from(s)
  }, [tasks])

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const toggleSelect = (id: string) => setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const clearSelection = () => setSelectedIds([])
  const selectAllVisible = () => setSelectedIds(filteredAndSorted.map((t) => t.id))

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)

  const bulkUpdateStatus = async (status: TaskStatus) => {
    // optimistic update
    setTasks((prev) => prev.map((t) => (selectedIds.includes(t.id) ? { ...t, status, updatedAt: new Date().toISOString(), completionPercentage: status === 'completed' ? 100 : t.completionPercentage } : t)))
    for (const id of selectedIds) {
      await onTaskUpdate?.(id, { status })
    }
    clearSelection()
  }

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} tasks? This cannot be undone.`)) return
    for (const id of selectedIds) {
      try {
        await onTaskDelete?.(id)
        setTasks((prev) => prev.filter((t) => t.id !== id))
      } catch (e) { console.error('delete failed', e) }
    }
    clearSelection()
  }

  const exportSelectedCsv = () => {
    if (selectedIds.length === 0) return
    const rows = [['id','title','status','priority','dueDate','assignee','estimatedHours','actualHours','revenueImpact']]
    for (const t of tasks.filter((x) => selectedIds.includes(x.id))) {
      rows.push([t.id, t.title, t.status, t.priority, t.dueDate, t.assignee || '', String(t.estimatedHours || 0), String(t.actualHours ?? ''), String(t.revenueImpact ?? '')])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks_export_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // debounce search -> inform parent to perform server-side search
  useEffect(() => {
    if (!onSearch) return
    const handler = setTimeout(() => {
      onSearch(filters.search.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [filters.search, onSearch])

  const taskStats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const acc = tasks.reduce(
      (a, t) => {
        const d = new Date(t.dueDate)
        const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        a.total += 1
        if (dOnly < today && t.status !== 'completed') a.overdue += 1
        if (dOnly.getTime() === today.getTime()) a.dueToday += 1
        if (t.status === 'completed') a.completed += 1
        if (t.status === 'in_progress') a.inProgress += 1
        return a
      },
      { total: 0, overdue: 0, dueToday: 0, completed: 0, inProgress: 0, productivity: 0 }
    )
    acc.productivity = acc.total > 0 ? Math.round((acc.completed / acc.total) * 100) : 0
    return acc
  }, [tasks])

  const filteredAndSorted = useMemo(() => {
    const filtered = tasks.filter((t) => {
      const byStatus = filters.status === 'all' || t.status === filters.status
      const byPriority = filters.priority === 'all' || t.priority === filters.priority
      const byCategory = filters.category === 'all' || t.category === filters.category
      const byAssignee = filters.assignee === 'all' || t.assignee === filters.assignee
      const q = filters.search.trim().toLowerCase()
      const bySearch = !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      return byStatus && byPriority && byCategory && byAssignee && bySearch
    })

    const order: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'priority':
          return (order[b.priority] || 0) - (order[a.priority] || 0)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'assignee':
          return (a.assignee || '').localeCompare(b.assignee || '')
        default:
          return 0
      }
    })
    return filtered
  }, [tasks, filters, sortBy])

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                completionPercentage: status === 'completed' ? 100 : t.completionPercentage,
                completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      )
      await onTaskUpdate?.(taskId, { status })
    },
    [onTaskUpdate]
  )

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'review':
        return 'text-purple-600 bg-purple-50'
      case 'blocked':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryIcon = (c: string) => {
    switch (c) {
      case 'finance':
        return DollarSign
      case 'compliance':
        return AlertTriangle
      case 'client':
        return User
      case 'system':
        return Settings
      case 'marketing':
        return TrendingUp
      case 'booking':
        return Calendar
      default:
        return FileText
    }
  }

  const isOverdue = (dueDate: string, status: string) => new Date(dueDate) < new Date() && status !== 'completed'

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const CategoryIcon = getCategoryIcon(task.category)
    const overdue = isOverdue(task.dueDate, task.status)
    return (
      <Card
        className={`transition-all hover:shadow-md ${overdue ? 'border-red-200 bg-red-50' : 'hover:border-gray-300'}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(task.id)}
                onChange={(e) => { e.stopPropagation(); toggleSelect(task.id) }}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4"
              />
              <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)} border`}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium line-clamp-1">{task.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {overdue && <AlertCircle className="h-4 w-4 text-red-500" />}
              {task.complianceRequired && <Flag className="h-4 w-4 text-orange-500" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {task.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{task.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    task.completionPercentage === 100
                      ? 'bg-green-500'
                      : task.completionPercentage > 75
                      ? 'bg-blue-500'
                      : task.completionPercentage > 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${task.completionPercentage}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className={overdue ? 'text-red-600 font-medium' : ''}>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedHours}h est.</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignee || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span className="capitalize">{task.category}</span>
              </div>
            </div>
            {typeof task.actualHours === 'number' && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{task.actualHours}h actual</span>
                {(() => {
                  const delta = (task.actualHours || 0) - (task.estimatedHours || 0)
                  const positive = delta > 0
                  const cls = positive ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'
                  const sign = positive ? '+' : ''
                  return <Badge variant="outline" className={`px-1 py-0 ${cls}`}>{`Δ ${sign}${delta.toFixed(1)}h`}</Badge>
                })()}
              </div>
            )}
            {typeof task.revenueImpact === 'number' && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded p-2">
                <DollarSign className="h-3 w-3" />
                <span>Revenue Impact: ${task.revenueImpact}</span>
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <div className="flex gap-1">
              {task.status !== 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => updateTaskStatus(task.id, task.status === 'in_progress' ? 'completed' : 'in_progress')}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {task.status === 'in_progress' ? 'Complete' : 'Start'}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedTask(task); setShowTaskModal(true) }}>
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const Stats: React.FC = () => (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      {[
        { label: 'Total Tasks', value: taskStats.total, icon: Target, color: 'text-gray-600' },
        { label: 'Overdue', value: taskStats.overdue, icon: AlertCircle, color: 'text-red-600' },
        { label: 'Due Today', value: taskStats.dueToday, icon: Calendar, color: 'text-orange-600' },
        { label: 'In Progress', value: taskStats.inProgress, icon: BarChart3, color: 'text-blue-600' },
        { label: 'Completed', value: taskStats.completed, icon: CheckCircle2, color: 'text-green-600' },
        { label: 'Productivity', value: `${taskStats.productivity}%`, icon: BarChart3, color: 'text-purple-600' },
      ].map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card key={idx} className="text-center">
            <CardContent className="p-4">
              <Icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Organize and track team productivity</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!onTaskCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <Stats />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
                />
              </div>
              {([
                { key: 'status', options: ['all', 'pending', 'in_progress', 'review', 'completed', 'blocked'] },
                { key: 'priority', options: ['all', 'low', 'medium', 'high', 'critical'] },
                { key: 'category', options: ['all', 'booking', 'client', 'system', 'finance', 'compliance', 'marketing'] },
              ] as const).map((f) => (
                <select
                  key={f.key}
                  value={filters[f.key]}
                  onChange={(e) => setFilters((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm capitalize"
                >
                  {f.options.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">
                      {opt.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              ))}
              <select
                value={filters.assignee}
                onChange={(e) => setFilters((p) => ({ ...p, assignee: e.target.value }))}
                className="border rounded px-3 py-2 text-sm capitalize"
              >
                <option value="all">all</option>
                {assigneeOptions.map((name) => (
                  <option key={name} value={name} className="capitalize">{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'status' | 'assignee')}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="assignee">Assignee</option>
                </select>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {([
                  { mode: 'list', icon: FileText },
                  { mode: 'board', icon: BarChart3 },
                  { mode: 'calendar', icon: Calendar },
                ] as const).map(({ mode, icon: Icon }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setViewMode(mode)}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white border rounded p-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">{selectedIds.length} selected</div>
            <Button variant="ghost" size="sm" onClick={selectAllVisible}>Select all visible</Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => bulkUpdateStatus('in_progress')}>Mark In Progress</Button>
            <Button size="sm" onClick={() => bulkUpdateStatus('completed')}>Mark Completed</Button>
            <Button variant="destructive" size="sm" onClick={bulkDelete}>Delete</Button>
            <Button size="sm" onClick={exportSelectedCsv}>Export CSV</Button>
          </div>
        </div>
      )}

      {viewMode === 'board' ? (
        <BoardView
          tasks={filteredAndSorted}
          onMove={(id, status) => updateTaskStatus(id, status)}
          renderCard={(task) => <TaskCard key={(task as any).id} task={task as any} />}
        />
      ) : filteredAndSorted.length <= 60 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSorted.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      ) : (
        <VirtualizedTaskList
          tasks={filteredAndSorted}
          itemHeight={320}
          overscan={4}
          renderItem={(task) => <TaskCard key={(task as any).id} task={task as any} />}
        />
      )}

      {filteredAndSorted.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or create a new task.</p>
            <Button onClick={() => setCreateOpen(true)} disabled={!onTaskCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!onTaskCreate) { setCreateOpen(false); return }
              const dueIso = createForm.dueDate ? new Date(createForm.dueDate).toISOString() : new Date().toISOString()
              await onTaskCreate({
                title: createForm.title,
                description: undefined,
                priority: createForm.priority,
                dueDate: dueIso,
                assignee: undefined,
                assigneeAvatar: undefined,
                status: 'pending',
                category: 'system',
                estimatedHours: 0,
                actualHours: undefined,
                completionPercentage: 0,
                dependencies: undefined,
                clientId: undefined,
                bookingId: undefined,
                completedAt: undefined,
                tags: undefined,
                revenueImpact: undefined,
                complianceRequired: false,
              })
              setCreateForm({ title: '', dueDate: '', priority: 'medium' })
              setCreateOpen(false)
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Title</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Task title"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Due date</label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm((p) => ({ ...p, priority: e.target.value as Priority }))}
                  className="w-full border rounded px-3 py-2 text-sm capitalize"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!createForm.title.trim()}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadTasks = useCallback(async (q?: string) => {
    try {
      setErrorMsg(null)
      const qp = q ? `&q=${encodeURIComponent(q)}` : ''
      const res = await apiFetch(`/api/admin/tasks?limit=50${qp}`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const list = (await res.json()) as TaskItem[]
      const normalized = (Array.isArray(list) ? list : []).map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt ? String(t.dueAt) : null,
        priority: (t.priority as TaskItem['priority']) || 'MEDIUM',
        status: (t.status as TaskItem['status']) || 'OPEN',
        assigneeId: t.assigneeId ?? null,
        createdAt: t.createdAt ? String(t.createdAt) : undefined,
        updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
      }))
      setTasks(normalized)
    } catch (e) {
      console.error('loadTasks error', e)
      setErrorMsg('Unable to load tasks')
      setTasks([])
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  // Real-time updates via SSE: reload list on events
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/admin/tasks/updates')
      es.onmessage = () => {
        loadTasks()
      }
      es.onerror = (e) => {
        // silently ignore, will attempt reconnect from server
        console.debug('SSE error', e)
        es?.close()
      }
    } catch (e) {
      console.debug('SSE not available', e)
    }
    return () => es?.close()
  }, [loadTasks])

  const mapApiToUi = (t: TaskItem) => ({
    id: t.id,
    title: t.title,
    priority: t.priority === 'HIGH' ? 'high' : t.priority === 'LOW' ? 'low' : 'medium',
    dueDate: t.dueAt ? String(t.dueAt) : new Date().toISOString(),
    status: t.status === 'DONE' ? 'completed' : t.status === 'IN_PROGRESS' ? 'in_progress' : 'pending',
    category: 'system',
    estimatedHours: 0,
    completionPercentage: t.status === 'DONE' ? 100 : 0,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
    complianceRequired: false,
  } as Task)

  const uiTasks = tasks.map(mapApiToUi)

  const onTaskUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      const payload: Record<string, unknown> = {}
      if (updates.title !== undefined) payload.title = updates.title
      if (updates.dueDate !== undefined) payload.dueAt = updates.dueDate
      if (updates.priority !== undefined) payload.priority = updates.priority === 'high' ? 'HIGH' : updates.priority === 'low' ? 'LOW' : 'MEDIUM'
      if (updates.status !== undefined) payload.status = updates.status === 'completed' ? 'DONE' : updates.status === 'in_progress' ? 'IN_PROGRESS' : 'OPEN'
      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
    } catch (e) { console.error('update failed', e) }
  }

  const onTaskCreate = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: task.title,
        dueAt: task.dueDate,
        priority: task.priority === 'high' ? 'HIGH' : task.priority === 'low' ? 'LOW' : 'MEDIUM',
      }) })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      await loadTasks()
    } catch (e) { console.error('create failed', e) }
  }

  const onTaskDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      await loadTasks()
    } catch (e) { console.error('delete failed', e) }
  }

  const onTaskSave = async (id: string, updates: Record<string, any>) => {
    try {
      const payload: Record<string, unknown> = {}
      if (updates.title !== undefined) payload.title = updates.title
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.dueDate !== undefined) payload.dueAt = updates.dueDate
      if (updates.priority !== undefined) payload.priority = updates.priority === 'high' ? 'HIGH' : updates.priority === 'low' ? 'LOW' : 'MEDIUM'
      if (updates.estimatedHours !== undefined) payload.estimatedHours = updates.estimatedHours
      if (updates.actualHours !== undefined) payload.actualHours = updates.actualHours
      if (updates.status !== undefined) payload.status = updates.status === 'completed' ? 'DONE' : updates.status === 'in_progress' ? 'IN_PROGRESS' : updates.status

      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      await loadTasks()
    } catch (e) { console.error('save failed', e) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {errorMsg && (
          <div className="mb-2 border border-red-200 bg-red-50 text-red-800 rounded-md p-3 text-sm">
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-600 hover:text-red-800">×</button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Create, assign, and track admin tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline"><Link href="/admin">Back to Dashboard</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/tasks/new">Quick Task</Link></Button>
          </div>
        </div>
        <TaskManagementSystem initialTasks={uiTasks} onTaskUpdate={onTaskUpdate} onTaskCreate={onTaskCreate} onTaskDelete={onTaskDelete} onSearch={(q) => loadTasks(q)} />
      </div>
    </div>
  )
}
