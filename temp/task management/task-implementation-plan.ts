}

// ================================
// 7. Widget Components (widgets/)
// ================================

// TaskPriority.tsx
'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Minus, ArrowUp, Zap } from 'lucide-react'
import type { TaskPriority as TaskPriorityType } from '@/lib/tasks/types'

interface TaskPriorityProps {
  priority: TaskPriorityType
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const priorityConfig = {
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: Zap
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: ArrowUp
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertTriangle
  },
  low: {
    label: 'Low',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: Minus
  }
}

export const TaskPriority: React.FC<TaskPriorityProps> = ({ 
  priority, 
  showIcon = true, 
  size = 'sm' 
}) => {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      {showIcon && <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />}
      {config.label}
    </Badge>
  )
}

// TaskStatus.tsx
'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, Play, Eye, CheckCircle, XCircle, 
  Pause, RotateCcw 
} from 'lucide-react'
import type { TaskStatus as TaskStatusType } from '@/lib/tasks/types'

interface TaskStatusProps {
  status: TaskStatusType
  showIcon?: boolean
  animated?: boolean
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800',
    icon: Clock
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800',
    icon: Play
  },
  review: {
    label: 'Review',
    className: 'bg-purple-100 text-purple-800',
    icon: Eye
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

export const TaskStatus: React.FC<TaskStatusProps> = ({ 
  status, 
  showIcon = true, 
  animated = false 
}) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} text-xs ${animated ? 'animate-pulse' : ''}`}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}

// TaskProgress.tsx
'use client'

import React from 'react'

interface TaskProgressProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ 
  percentage, 
  showLabel = false, 
  size = 'md',
  className = '' 
}) => {
  const height = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2'
  
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500'
    if (percent >= 75) return 'bg-blue-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-red-400'
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div 
          className={`${height} rounded-full transition-all duration-500 ease-out ${getProgressColor(percentage)}`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}

// ================================
// 8. Main Tasks Page (app/admin/tasks/page.tsx)
// ================================

'use client'

import React, { useState, useEffect } from 'react'
import { TaskProvider } from '@/components/tasks/providers/TaskProvider'
import { TasksHeader } from '@/components/tasks/layout/TasksHeader'
import { TasksToolbar } from '@/components/tasks/layout/TasksToolbar'
import { TasksStats } from '@/components/tasks/layout/TasksStats'
import { TaskListView } from '@/components/tasks/views/TaskListView'
import { TaskBoardView } from '@/components/tasks/views/TaskBoardView'
import { TaskCalendarView } from '@/components/tasks/views/TaskCalendarView'
import { TaskForm } from '@/components/tasks/forms/TaskForm'
import { TaskDetailsModal } from '@/components/tasks/modals/TaskDetailsModal'
import { BulkActionsModal } from '@/components/tasks/modals/BulkActionsModal'
import { useTasks } from '@/components/tasks/providers/TaskProvider'
import type { Task, TaskFilters } from '@/lib/tasks/types'

type ViewMode = 'list' | 'board' | 'calendar'
type SortOption = 'dueDate' | 'priority' | 'status' | 'assignee' | 'created'

const TasksPageContent = () => {
  // State Management
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    category: [],
    assignee: [],
    dateRange: undefined,
    overdue: false,
    complianceOnly: false
  })
  
  // Modal States
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Task Context
  const { 
    tasks, 
    loading, 
    error, 
    stats, 
    loadTasks, 
    createTask, 
    updateTask, 
    deleteTask,
    bulkUpdateTasks
  } = useTasks()

  // Load tasks on mount and filter changes
  useEffect(() => {
    loadTasks(filters)
  }, [filters, loadTasks])

  // Handlers
  const handleNewTask = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleTaskSave = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData)
      } else {
        await createTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>)
      }
      setShowTaskForm(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleBulkAction = async (action: string, updates?: Partial<Task>) => {
    try {
      switch (action) {
        case 'delete':
          // Handle bulk delete
          for (const id of selectedTasks) {
            await deleteTask(id)
          }
          break
        case 'update':
          if (updates) {
            await bulkUpdateTasks(selectedTasks, updates)
          }
          break
      }
      setSelectedTasks([])
      setShowBulkActions(false)
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    }
  }

  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'search' && value) return count + 1
    if (Array.isArray(value) && value.length > 0) return count + 1
    if (typeof value === 'boolean' && value) return count + 1
    if (typeof value === 'object' && value && Object.keys(value).length > 0) return count + 1
    return count
  }, 0)

  const resetFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      category: [],
      assignee: [],
      dateRange: undefined,
      overdue: false,
      complianceOnly: false
    })
  }

  // Render different views
  const renderTaskView = () => {
    const commonProps = {
      tasks,
      selectedTasks,
      onTaskSelect: setSelectedTasks,
      onTaskEdit: handleEditTask,
      onTaskDelete: deleteTask,
      onTaskStatusChange: (id: string, status: TaskStatus) => 
        updateTask(id, { status }),
      onTaskDetails: setSelectedTask
    }

    switch (viewMode) {
      case 'board':
        return <TaskBoardView {...commonProps} />
      case 'calendar':
        return <TaskCalendarView {...commonProps} />
      default:
        return <TaskListView {...commonProps} />
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tasks</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => loadTasks(filters)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <TasksHeader 
        stats={stats}
        onNewTask={handleNewTask}
        onBulkActions={() => setShowBulkActions(true)}
        selectedTasksCount={selectedTasks.length}
      />

      {/* Statistics */}
      {stats && <TasksStats stats={stats} />}

      {/* Toolbar */}
      <TasksToolbar 
        searchQuery={filters.search}
        onSearchChange={(search) => setFilters(prev => ({ ...prev, search }))}
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeFilterCount={activeFilterCount}
        onResetFilters={resetFilters}
      />

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </div>
      ) : (
        renderTaskView()
      )}

      {/* Modals */}
      {showTaskForm && (
        <TaskForm 
          task={editingTask}
          mode={editingTask ? 'edit' : 'create'}
          onSave={handleTaskSave}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(null)
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={handleEditTask}
          onDelete={deleteTask}
        />
      )}

      {showBulkActions && selectedTasks.length > 0 && (
        <BulkActionsModal 
          selectedTasks={selectedTasks}
          onAction={handleBulkAction}
          onClose={() => setShowBulkActions(false)}
        />
      )}
    </div>
  )
}

export default function TasksPage() {
  return (
    <TaskProvider>
      <TasksPageContent />
    </TaskProvider>
  )
}

// ================================
// 9. API Route (api/admin/tasks/route.ts)
// ================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Task, TaskFilters, TaskStatistics } from '@/lib/tasks/types'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'blocked']).default('pending'),
  category: z.enum(['booking', 'client', 'system', 'finance', 'compliance', 'marketing']),
  dueDate: z.string(),
  estimatedHours: z.number().positive(),
  assigneeId: z.string().optional(),
  clientId: z.string().optional(),
  bookingId: z.string().optional(),
  revenueImpact: z.number().optional(),
  complianceRequired: z.boolean().default(false),
  tags: z.array(z.string()).default([])
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: TaskFilters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status')?.split(',') || [],
      priority: searchParams.get('priority')?.split(',') || [],
      category: searchParams.get('category')?.split(',') || [],
      assignee: searchParams.get('assignee')?.split(',') || [],
      dateRange: searchParams.get('dateRange') ? 
        JSON.parse(searchParams.get('dateRange')!) : undefined,
      overdue: searchParams.get('overdue') === 'true',
      complianceOnly: searchParams.get('complianceOnly') === 'true'
    }

    // Build where clause
    const where: any = {}

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.priority.length > 0) {
      where.priority = { in: filters.priority }
    }

    if (filters.category.length > 0) {
      where.category = { in: filters.category }
    }

    if (filters.assignee.length > 0) {
      where.assigneeId = { in: filters.assignee }
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      where.dueDate = {}
      if (filters.dateRange.start) {
        where.dueDate.gte = new Date(filters.dateRange.start)
      }
      if (filters.dateRange.end) {
        where.dueDate.lte = new Date(filters.dateRange.end)
      }
    }

    if (filters.overdue) {
      where.dueDate = { lt: new Date() }
      where.status = { not: 'completed' }
    }

    if (filters.complianceOnly) {
      where.complianceRequired = true
    }

    // Fetch tasks with relations
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        client: {
          select: { id: true, name: true, email: true }
        },
        booking: {
          select: { id: true, scheduledAt: true, service: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate statistics
    const stats = await calculateTaskStatistics(where)

    return NextResponse.json({ 
      tasks, 
      stats,
      total: tasks.length 
    })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
        completionPercentage: 0
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        client: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Send notification if assigned
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      await sendTaskAssignmentNotification(task)
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors }, 
        { status: 400 }
      )
    }
    
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' }, 
      { status: 500 }
    )
  }
}

async function calculateTaskStatistics(whereClause: any): Promise<TaskStatistics> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const [
    total,
    overdue,
    dueToday,
    completed,
    inProgress,
    byPriority,
    byCategory
  ] = await Promise.all([
    prisma.task.count({ where: whereClause }),
    prisma.task.count({ 
      where: { 
        ...whereClause, 
        dueDate: { lt: today }, 
        status: { not: 'completed' } 
      } 
    }),
    prisma.task.count({ 
      where: { 
        ...whereClause, 
        dueDate: { 
          gte: today, 
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.task.count({ 
      where: { ...whereClause, status: 'completed' } 
    }),
    prisma.task.count({ 
      where: { ...whereClause, status: 'in_progress' } 
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { id: true }
    }),
    prisma.task.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { id: true }
    })
  ])

  const productivity = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    overdue,
    dueToday,
    completed,
    inProgress,
    productivity,
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority as any] = item._count.id
      return acc
    }, {} as Record<any, number>),
    byCategory: byCategory.reduce((acc, item) => {
      acc[item.category as any] = item._count.id
      return acc
    }, {} as Record<any, number>)
  }
}

async function sendTaskAssignmentNotification(task: any) {
  // Implementation for sending email notification
  // This would integrate with your email system
  try {
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: task.assignee?.email,
        subject: `New Task Assigned: ${task.title}`,
        template: 'task-assignment',
        data: {
          taskTitle: task.title,
          taskDescription: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          assignedBy: task.createdBy?.name
        }
      })
    })
  } catch (error) {
    console.error('Failed to send task assignment notification:', error)
  }
}

// ================================
// 10. Database Schema (prisma/schema.prisma additions)
// ================================

/*
Add these models to your existing schema.prisma:

model Task {
  id                   String    @id @default(cuid())
  title                String
  description          String?
  priority             TaskPriority
  status               TaskStatus   @default(PENDING)
  category             TaskCategory
  dueDate              DateTime
  estimatedHours       Float
  actualHours          Float?
  completionPercentage Int          @default(0)
  revenueImpact        Float?
  complianceRequired   Boolean      @default(false)
  tags                 String[]
  
  // Relations
  assigneeId           String?
  assignee             User?        @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdById          String
  createdBy            User         @relation("TaskCreatedBy", fields: [createdById], references: [id])
  clientId             String?
  client               User?        @relation("TaskClient", fields: [clientId], references: [id])
  bookingId            String?
  booking              Booking?     @relation(fields: [bookingId], references: [id])
  
  // Metadata
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
  completedAt          DateTime?
  
  // Additional relations
  comments             TaskComment[]
  attachments          TaskAttachment[]
  
  @@map("tasks")
}

model TaskComment {
  id        String   @id @default(cuid())
  content   String
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("task_comments")
}

model TaskAttachment {
  id       String @id @default(cuid())
  filename String
  url      String
  size     Int
  type     String
  taskId   String
  task     Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User   @relation(fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now())
  
  @@map("task_attachments")
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  REVIEW
  COMPLETED
  BLOCKED
}

enum TaskCategory {
  BOOKING
  CLIENT
  SYSTEM
  FINANCE
  COMPLIANCE
  MARKETING
}

// Update User model to include task relations
model User {
  // ... existing fields
  
  // Task relations
  assignedTasks        Task[]           @relation("TaskAssignee")
  createdTasks         Task[]           @relation("TaskCreatedBy")
  clientTasks          Task[]           @relation("TaskClient")
  taskComments         TaskComment[]
  taskAttachments      TaskAttachment[]
  
  // ... rest of model
}
*/

// ================================
// 11. Implementation Checklist
// ================================

/*
IMPLEMENTATION PRIORITY ORDER:

Phase 1: Core Foundation (Week 1)
□ Set up database schema and run migrations
□ Create core types and interfaces
□ Implement TaskProvider and basic context
□ Build basic task card components
□ Create main tasks page with list view

Phase 2: Essential Components (Week 2)  
□ Implement task creation/edit forms
□ Add task filtering and search
□ Build task statistics dashboard
□ Create task detail modal
□ Add basic CRUD API endpoints

Phase 3: Enhanced Features (Week 3)
□ Implement board view (Kanban)
□ Add bulk operations
□ Create task assignment system
□ Build notification system
□ Add calendar integration

Phase 4: Advanced Features (Week 4)
□ Implement task analytics
□ Add file attachments
□ Create task templates
□ Build reporting features
□ Add real-time updates

Phase 5: Integration & Polish (Week 5)
□ Integrate with existing booking system
□ Connect to client portal
□ Add email notifications
□ Implement role-based permissions
□ Performance optimization

CRITICAL DEPENDENCIES:
1. Update User model to include task relations
2. Create TaskTeamMember model for staff management
3. Set up email notification system
4. Configure file upload for attachments
5. Implement WebSocket for real-time updates

PERFORMANCE CONSIDERATIONS:
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Add database indexing for search fields
- Use server-side pagination for large datasets
- Cache frequently accessed data

TESTING STRATEGY:
- Unit tests for utility functions
- Component tests for UI interactions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for large datasets

DEPLOYMENT NOTES:
- Add environment variables for feature flags
- Configure database indexes for performance
- Set up monitoring for task operations
- Create backup procedures for task data
- Document API endpoints for integrations
*/// ================================
// 1. Core Types (lib/tasks/types.ts)
// ================================

export interface Task {
  // Core Properties
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  category: TaskCategory
  
  // Scheduling
  dueDate: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  
  // Assignment
  assignee?: User
  assigneeId?: string
  createdBy: User
  
  // Progress
  completionPercentage: number
  dependencies?: string[]
  
  // Business Context
  clientId?: string
  client?: Client
  bookingId?: string
  booking?: Booking
  revenueImpact?: number
  complianceRequired: boolean
  
  // Metadata
  tags: string[]
  attachments?: TaskAttachment[]
  comments?: TaskComment[]
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
export type TaskCategory = 'booking' | 'client' | 'system' | 'finance' | 'compliance' | 'marketing'

export interface TaskFilters {
  search: string
  status: TaskStatus[]
  priority: TaskPriority[]
  category: TaskCategory[]
  assignee: string[]
  dateRange?: {
    start?: string
    end?: string
  }
  overdue: boolean
  complianceOnly: boolean
}

export interface TaskStatistics {
  total: number
  overdue: number
  dueToday: number
  completed: number
  inProgress: number
  productivity: number
  byPriority: Record<TaskPriority, number>
  byCategory: Record<TaskCategory, number>
}

// ================================
// 2. Task Provider (providers/TaskProvider.tsx)
// ================================

'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { Task, TaskFilters, TaskStatistics } from '@/lib/tasks/types'

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  stats: TaskStatistics | null
}

interface TaskContextValue extends TaskState {
  // CRUD Operations
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => Promise<void>
  
  // Data Management
  refreshTasks: () => Promise<void>
  loadTasks: (filters?: TaskFilters) => Promise<void>
}

const TaskContext = createContext<TaskContextValue | null>(null)

type TaskAction = 
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { tasks: Task[]; stats: TaskStatistics } }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'BULK_UPDATE'; payload: { ids: string[]; updates: Partial<Task> } }

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null }
    
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        tasks: action.payload.tasks,
        stats: action.payload.stats,
        error: null
      }
    
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload }
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      }
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        )
      }
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      }
    
    case 'BULK_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          action.payload.ids.includes(task.id)
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        )
      }
    
    default:
      return state
  }
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: false,
    error: null,
    stats: null
  })

  const loadTasks = useCallback(async (filters?: TaskFilters) => {
    dispatch({ type: 'LOAD_START' })
    
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
              params.append(key, value.join(','))
            } else if (typeof value === 'object' && value !== null) {
              params.append(key, JSON.stringify(value))
            } else if (typeof value === 'boolean') {
              params.append(key, value.toString())
            } else {
              params.append(key, String(value))
            }
          }
        })
      }

      const response = await fetch(`/api/admin/tasks?${params}`)
      if (!response.ok) throw new Error('Failed to load tasks')
      
      const data = await response.json()
      dispatch({ 
        type: 'LOAD_SUCCESS', 
        payload: { tasks: data.tasks, stats: data.stats }
      })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [])

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (!response.ok) throw new Error('Failed to create task')
      
      const newTask = await response.json()
      dispatch({ type: 'ADD_TASK', payload: newTask })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to create task'
      })
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/admin/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Failed to update task')
      
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates } })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update task'
      })
    }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete task')
      
      dispatch({ type: 'DELETE_TASK', payload: id })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to delete task'
      })
    }
  }, [])