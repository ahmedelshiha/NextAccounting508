// /api/admin/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Validation Schemas
const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  category: z.enum(['Tax Preparation', 'Audit', 'Consultation', 'Bookkeeping', 'Compliance', 'General']),
  dueDate: z.string().refine(date => new Date(date) > new Date(), "Due date must be in future"),
  estimatedHours: z.number().min(0.1, "Must estimate at least 6 minutes").max(1000, "Estimate too large"),
  assigneeId: z.string().optional(),
  collaboratorIds: z.array(z.string()).optional(),
  clientId: z.string().optional(),
  bookingId: z.string().optional(),
  complianceRequired: z.boolean().optional(),
  complianceDeadline: z.string().optional(),
  tags: z.array(z.string()).max(10, "Too many tags").optional(),
  dependencies: z.array(z.string()).optional()
}).refine(data => {
  if (data.complianceRequired && !data.complianceDeadline) {
    return false
  }
  return true
}, {
  message: "Compliance deadline required for compliance tasks",
  path: ["complianceDeadline"]
})

const TaskFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['Not Started', 'In Progress', 'Review', 'Completed', 'On Hold'])).optional(),
  priority: z.array(z.enum(['Critical', 'High', 'Medium', 'Low'])).optional(),
  category: z.array(z.enum(['Tax Preparation', 'Audit', 'Consultation', 'Bookkeeping', 'Compliance', 'General'])).optional(),
  assignee: z.array(z.string()).optional(),
  client: z.array(z.string()).optional(),
  overdue: z.boolean().optional(),
  compliance: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
})

// Types
interface Task {
  id: string
  title: string
  description?: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'On Hold'
  category: 'Tax Preparation' | 'Audit' | 'Consultation' | 'Bookkeeping' | 'Compliance' | 'General'
  dueDate: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  collaborators: Array<{
    id: string
    name: string
    email: string
  }>
  client?: {
    id: string
    name: string
    tier: string
  }
  booking?: {
    id: string
    service: string
    date: string
  }
  complianceRequired: boolean
  complianceDeadline?: string
  tags: string[]
  dependencies: string[]
  createdBy: {
    id: string
    name: string
  }
  completionPercentage: number
}

interface TaskStatistics {
  total: number
  overdue: number
  dueToday: number
  dueSoon: number
  completed: number
  inProgress: number
  notStarted: number
  onHold: number
  byPriority: Record<string, number>
  byCategory: Record<string, number>
  byAssignee: Record<string, number>
  averageCompletionTime: number
  productivityScore: number
}

// Database simulation (replace with actual database)
let tasks: Task[] = [
  {
    id: '1',
    title: 'Complete Q3 Tax Return for TechCorp',
    description: 'Prepare and review quarterly tax return submission for TechCorp Industries including all supporting documentation.',
    priority: 'High',
    status: 'In Progress',
    category: 'Tax Preparation',
    dueDate: '2025-09-20T00:00:00Z',
    createdAt: '2025-09-10T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    estimatedHours: 8,
    actualHours: 5.5,
    assignee: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@firm.com',
      avatar: '/api/placeholder/32/32'
    },
    collaborators: [
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael@firm.com'
      }
    ],
    client: {
      id: '1',
      name: 'TechCorp Industries',
      tier: 'Enterprise'
    },
    complianceRequired: true,
    complianceDeadline: '2025-09-25T00:00:00Z',
    tags: ['quarterly', 'corporate', 'urgent'],
    dependencies: [],
    createdBy: {
      id: '1',
      name: 'Admin User'
    },
    completionPercentage: 70
  },
  {
    id: '2',
    title: 'Audit Review - Local Restaurant Group',
    description: 'Conduct comprehensive audit review for Local Restaurant Group annual financial statements.',
    priority: 'Medium',
    status: 'Not Started',
    category: 'Audit',
    dueDate: '2025-09-25T00:00:00Z',
    createdAt: '2025-09-12T09:15:00Z',
    updatedAt: '2025-09-12T09:15:00Z',
    estimatedHours: 12,
    assignee: {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@firm.com'
    },
    collaborators: [],
    client: {
      id: '2',
      name: 'Local Restaurant Group',
      tier: 'SMB'
    },
    complianceRequired: false,
    tags: ['audit', 'annual'],
    dependencies: [],
    createdBy: {
      id: '1',
      name: 'Admin User'
    },
    completionPercentage: 0
  },
  {
    id: '3',
    title: 'Financial Consultation - John Smith',
    description: 'Individual financial planning consultation including retirement planning and tax optimization strategies.',
    priority: 'Low',
    status: 'Completed',
    category: 'Consultation',
    dueDate: '2025-09-15T00:00:00Z',
    createdAt: '2025-09-08T11:20:00Z',
    updatedAt: '2025-09-14T16:45:00Z',
    completedAt: '2025-09-14T16:45:00Z',
    estimatedHours: 2,
    actualHours: 1.5,
    assignee: {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@firm.com'
    },
    collaborators: [],
    client: {
      id: '3',
      name: 'John Smith',
      tier: 'Individual'
    },
    complianceRequired: false,
    tags: ['consultation', 'individual', 'retirement'],
    dependencies: [],
    createdBy: {
      id: '2',
      name: 'Michael Chen'
    },
    completionPercentage: 100
  }
]

// Utility Functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function calculateTaskStatistics(filteredTasks: Task[]): TaskStatistics {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const stats: TaskStatistics = {
    total: filteredTasks.length,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    onHold: 0,
    byPriority: { Critical: 0, High: 0, Medium: 0, Low: 0 },
    byCategory: {
      'Tax Preparation': 0,
      'Audit': 0,
      'Consultation': 0,
      'Bookkeeping': 0,
      'Compliance': 0,
      'General': 0
    },
    byAssignee: {},
    averageCompletionTime: 0,
    productivityScore: 0
  }

  const completedTasks = filteredTasks.filter(task => task.status === 'Completed')
  const completionTimes: number[] = []

  filteredTasks.forEach(task => {
    const dueDate = new Date(task.dueDate)
    
    // Date-based counts
    if (dueDate < today && task.status !== 'Completed') {
      stats.overdue++
    } else if (dueDate >= today && dueDate < tomorrow) {
      stats.dueToday++
    } else if (dueDate >= tomorrow && dueDate < nextWeek) {
      stats.dueSoon++
    }

    // Status counts
    switch (task.status) {
      case 'Completed':
        stats.completed++
        break
      case 'In Progress':
        stats.inProgress++
        break
      case 'Not Started':
        stats.notStarted++
        break
      case 'On Hold':
        stats.onHold++
        break
    }

    // Priority counts
    stats.byPriority[task.priority]++

    // Category counts
    stats.byCategory[task.category]++

    // Assignee counts
    if (task.assignee) {
      const assigneeName = task.assignee.name
      stats.byAssignee[assigneeName] = (stats.byAssignee[assigneeName] || 0) + 1
    }

    // Completion time calculation
    if (task.status === 'Completed' && task.actualHours) {
      completionTimes.push(task.actualHours)
    }
  })

  // Calculate averages
  if (completionTimes.length > 0) {
    stats.averageCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
  }

  // Calculate productivity score (simplified)
  const totalTasks = filteredTasks.length
  const completedOnTime = completedTasks.filter(task => {
    const dueDate = new Date(task.dueDate)
    const completedDate = new Date(task.completedAt!)
    return completedDate <= dueDate
  }).length

  stats.productivityScore = totalTasks > 0 ? Math.round((completedOnTime / totalTasks) * 100) : 0

  return stats
}

function filterTasks(tasks: Task[], filters: any): Task[] {
  let filtered = tasks

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.client?.name.toLowerCase().includes(searchLower) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  // Status filter
  if (filters.status?.length) {
    filtered = filtered.filter(task => filters.status.includes(task.status))
  }

  // Priority filter
  if (filters.priority?.length) {
    filtered = filtered.filter(task => filters.priority.includes(task.priority))
  }

  // Category filter
  if (filters.category?.length) {
    filtered = filtered.filter(task => filters.category.includes(task.category))
  }

  // Assignee filter
  if (filters.assignee?.length) {
    filtered = filtered.filter(task => 
      task.assignee && filters.assignee.includes(task.assignee.id)
    )
  }

  // Client filter
  if (filters.client?.length) {
    filtered = filtered.filter(task => 
      task.client && filters.client.includes(task.client.id)
    )
  }

  // Overdue filter
  if (filters.overdue) {
    const now = new Date()
    filtered = filtered.filter(task => 
      new Date(task.dueDate) < now && task.status !== 'Completed'
    )
  }

  // Compliance filter
  if (filters.compliance) {
    filtered = filtered.filter(task => task.complianceRequired)
  }

  // Tags filter
  if (filters.tags?.length) {
    filtered = filtered.filter(task =>
      filters.tags.some((tag: string) => task.tags.includes(tag))
    )
  }

  // Date range filter
  if (filters.dateRange?.start || filters.dateRange?.end) {
    filtered = filtered.filter(task => {
      const dueDate = new Date(task.dueDate)
      const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null
      const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null

      if (start && dueDate < start) return false
      if (end && dueDate > end) return false
      return true
    })
  }

  return filtered
}

// Authentication middleware
async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  return session
}

// GET /api/admin/tasks - List tasks with filtering and pagination
export async function GET(request: NextRequest) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Parse filters
    const filters = {
      search: searchParams.get('search') || '',
      status: searchParams.getAll('status'),
      priority: searchParams.getAll('priority'),
      category: searchParams.getAll('category'),
      assignee: searchParams.getAll('assignee'),
      client: searchParams.getAll('client'),
      overdue: searchParams.get('overdue') === 'true',
      compliance: searchParams.get('compliance') === 'true',
      tags: searchParams.getAll('tags'),
      dateRange: {
        start: searchParams.get('dateStart'),
        end: searchParams.get('dateEnd')
      }
    }

    // Validate filters
    const validatedFilters = TaskFiltersSchema.parse(filters)

    // Apply filters
    const filteredTasks = filterTasks(tasks, validatedFilters)

    // Apply pagination
    const paginatedTasks = filteredTasks.slice(offset, offset + limit)

    // Calculate statistics
    const stats = calculateTaskStatistics(filteredTasks)

    return NextResponse.json({
      tasks: paginatedTasks,
      statistics: stats,
      pagination: {
        page,
        limit,
        total: filteredTasks.length,
        totalPages: Math.ceil(filteredTasks.length / limit),
        hasNext: offset + limit < filteredTasks.length,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching tasks:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST /api/admin/tasks - Create new task
export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = CreateTaskSchema.parse(body)

    // Create new task
    const newTask: Task = {
      id: generateId(),
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      status: 'Not Started',
      category: validatedData.category,
      dueDate: validatedData.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedHours: validatedData.estimatedHours,
      assignee: validatedData.assigneeId ? {
        id: validatedData.assigneeId,
        name: 'Mock User', // In real implementation, fetch from database
        email: 'user@firm.com'
      } : undefined,
      collaborators: validatedData.collaboratorIds?.map(id => ({
        id,
        name: 'Mock User',
        email: 'user@firm.com'
      })) || [],
      client: validatedData.clientId ? {
        id: validatedData.clientId,
        name: 'Mock Client',
        tier: 'SMB'
      } : undefined,
      booking: validatedData.bookingId ? {
        id: validatedData.bookingId,
        service: 'Mock Service',
        date: new Date().toISOString()
      } : undefined,
      complianceRequired: validatedData.complianceRequired || false,
      complianceDeadline: validatedData.complianceDeadline,
      tags: validatedData.tags || [],
      dependencies: validatedData.dependencies || [],
      createdBy: {
        id: session.user.id,
        name: session.user.name
      },
      completionPercentage: 0
    }

    // Add to mock database
    tasks.push(newTask)

    return NextResponse.json(newTask, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating task:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// /api/admin/tasks/[id]/route.ts
// GET /api/admin/tasks/[id] - Get single task
export async function getTaskById(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const task = tasks.find(t => t.id === params.id)
    
    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    return NextResponse.json(task)

  } catch (error) {
    console.error('Error fetching task:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PUT /api/admin/tasks/[id] - Update task
export async function updateTaskById(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const taskIndex = tasks.findIndex(t => t.id === params.id)
    
    if (taskIndex === -1) {
      return new NextResponse('Task not found', { status: 404 })
    }

    const body = await request.json()
    const validatedData = CreateTaskSchema.partial().parse(body)

    // Update task
    const updatedTask = {
      ...tasks[taskIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }

    // Handle status change to completed
    if (validatedData.status === 'Completed' && tasks[taskIndex].status !== 'Completed') {
      updatedTask.completedAt = new Date().toISOString()
      updatedTask.completionPercentage = 100
    }

    tasks[taskIndex] = updatedTask

    return NextResponse.json(updatedTask)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating task:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// DELETE /api/admin/tasks/[id] - Delete task
export async function deleteTaskById(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const taskIndex = tasks.findIndex(t => t.id === params.id)
    
    if (taskIndex === -1) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Remove task
    tasks.splice(taskIndex, 1)

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('Error deleting task:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// /api/admin/tasks/bulk/route.ts
const BulkActionSchema = z.object({
  action: z.enum(['update', 'delete', 'assign']),
  taskIds: z.array(z.string()).min(1, "At least one task ID required"),
  updates: z.object({
    status: z.enum(['Not Started', 'In Progress', 'Review', 'Completed', 'On Hold']).optional(),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    assigneeId: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
})

// POST /api/admin/tasks/bulk - Bulk operations
export async function bulkTaskOperations(request: NextRequest) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { action, taskIds, updates } = BulkActionSchema.parse(body)

    const updatedTasks: Task[] = []
    const now = new Date().toISOString()

    switch (action) {
      case 'update':
        taskIds.forEach(id => {
          const taskIndex = tasks.findIndex(t => t.id === id)
          if (taskIndex !== -1) {
            tasks[taskIndex] = {
              ...tasks[taskIndex],
              ...updates,
              updatedAt: now
            }
            
            // Handle completion
            if (updates?.status === 'Completed' && tasks[taskIndex].status !== 'Completed') {
              tasks[taskIndex].completedAt = now
              tasks[taskIndex].completionPercentage = 100
            }
            
            updatedTasks.push(tasks[taskIndex])
          }
        })
        break

      case 'delete':
        taskIds.forEach(id => {
          const taskIndex = tasks.findIndex(t => t.id === id)
          if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1)
          }
        })
        break

      case 'assign':
        if (!updates?.assigneeId) {
          return NextResponse.json(
            { error: 'Assignee ID required for assign action' },
            { status: 400 }
          )
        }
        
        taskIds.forEach(id => {
          const taskIndex = tasks.findIndex(t => t.id === id)
          if (taskIndex !== -1) {
            tasks[taskIndex] = {
              ...tasks[taskIndex],
              assignee: {
                id: updates.assigneeId!,
                name: 'Mock User',
                email: 'user@firm.com'
              },
              updatedAt: now
            }
            updatedTasks.push(tasks[taskIndex])
          }
        })
        break
    }

    return NextResponse.json({
      success: true,
      updatedTasks,
      message: `${action} operation completed for ${taskIds.length} tasks`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error in bulk operation:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// /api/admin/tasks/statistics/route.ts
// GET /api/admin/tasks/statistics - Get task statistics for dashboard
export async function getTaskStatistics(request: NextRequest) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30' // days
    
    // Filter tasks by timeframe if needed
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe))
    
    const relevantTasks = tasks.filter(task => 
      new Date(task.createdAt) >= cutoffDate
    )

    const stats = calculateTaskStatistics(relevantTasks)
    
    // Add dashboard-specific metrics
    const dashboardStats = {
      ...stats,
      // Recent activity for dashboard feed
      recentTasks: tasks
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10),
      
      // Urgent tasks requiring attention
      urgentTasks: tasks.filter(task => {
        const dueDate = new Date(task.dueDate)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        return (
          task.priority === 'Critical' || 
          (dueDate <= tomorrow && task.status !== 'Completed') ||
          task.complianceRequired
        )
      }).slice(0, 5),

      // Performance metrics
      performance: {
        onTimeCompletion: Math.round(
          (tasks.filter(t => t.status === 'Completed' && t.completedAt && 
           new Date(t.completedAt) <= new Date(t.dueDate)).length / 
           Math.max(tasks.filter(t => t.status === 'Completed').length, 1)) * 100
        ),
        averageTaskAge: Math.round(
          tasks.filter(t => t.status !== 'Completed')
            .map(t => (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            .reduce((a, b) => a + b, 0) / 
          Math.max(tasks.filter(t => t.status !== 'Completed').length, 1)
        )
      }
    }

    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error('Error fetching task statistics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Export all functions for Next.js API routes
export {
  GET,
  POST,
  getTaskById as GET_ID,
  updateTaskById as PUT_ID,
  deleteTaskById as DELETE_ID,
  bulkTaskOperations as POST_BULK,
  getTaskStatistics as GET_STATS
}