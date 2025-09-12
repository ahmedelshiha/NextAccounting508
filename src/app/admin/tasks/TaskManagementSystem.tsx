"use client"

import React, { useMemo, useState, useCallback } from 'react'
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
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

export interface TaskManagementProps {
  initialTasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void> | void
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void
  onTaskDelete?: (taskId: string) => Promise<void> | void
}

export default function TaskManagementSystem({ initialTasks = [], onTaskUpdate, onTaskCreate }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filters, setFilters] = useState<{ status: string; priority: string; category: string; assignee: string; search: string }>({ status: 'all', priority: 'all', category: 'all', assignee: 'all', search: '' })
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'assignee'>('dueDate')

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
        return AlertTriangle
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
            <Button variant="ghost" size="sm" className="text-xs">
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
          <Button size="sm">
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
              {[
                { key: 'status', options: ['all', 'pending', 'in_progress', 'review', 'completed', 'blocked'] },
                { key: 'priority', options: ['all', 'low', 'medium', 'high', 'critical'] },
                { key: 'category', options: ['all', 'booking', 'client', 'system', 'finance', 'compliance', 'marketing'] },
              ].map((f) => (
                <select
                  key={f.key}
                  value={(filters as any)[f.key]}
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
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="assignee">Assignee</option>
                </select>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { mode: 'list', icon: FileText },
                  { mode: 'board', icon: BarChart3 },
                  { mode: 'calendar', icon: Calendar },
                ].map(({ mode, icon: Icon }) => (
                  <Button
                    key={mode}
                    variant={viewMode === (mode as any) ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setViewMode(mode as any)}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSorted.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or create a new task.</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
