// lib/tasks/types.ts
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
export type TaskCategory = 'booking' | 'client' | 'system' | 'finance' | 'compliance' | 'marketing'
export type ViewMode = 'list' | 'board' | 'calendar' | 'table'
export type SortOption = 'dueDate' | 'priority' | 'status' | 'assignee' | 'category'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

export interface Client {
  id: string
  name: string
  company?: string
  email: string
}

export interface Booking {
  id: string
  clientId: string
  service: string
  scheduledDate: string
  status: string
}

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  uploadedAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  user: User
  content: string
  createdAt: string
}

export interface TaskProgress {
  id: string
  taskId: string
  userId: string
  description: string
  percentage: number
  createdAt: string
}

export interface TaskReminder {
  id: string
  taskId: string
  reminderDate: string
  type: 'email' | 'push' | 'sms'
  sent: boolean
}

export interface TaskWorkflow {
  id: string
  name: string
  stages: string[]
  currentStage: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  defaultPriority: TaskPriority
  defaultCategory: TaskCategory
  estimatedHours: number
  checklistItems: string[]
}

export interface TaskRecurrence {
  enabled: boolean
  pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  interval: number
  endDate?: string
}

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
  
  // Assignment & Collaboration
  assignee?: User
  assigneeId?: string
  collaborators: User[]
  createdBy: User
  
  // Progress & Metrics
  completionPercentage: number
  progress: TaskProgress[]
  dependencies: string[]
  blockedBy?: string[]
  
  // Business Context
  clientId?: string
  client?: Client
  bookingId?: string
  booking?: Booking
  revenueImpact?: number
  complianceRequired: boolean
  complianceDeadline?: string
  
  // Metadata
  tags: string[]
  customFields: Record<string, any>
  attachments: TaskAttachment[]
  comments: TaskComment[]
  
  // Workflow
  workflow?: TaskWorkflow
  template?: TaskTemplate
  recurring?: TaskRecurrence
  
  // Notifications
  reminders: TaskReminder[]
  watchers: string[]
}

export interface TaskStatistics {
  total: number
  overdue: number
  dueToday: number
  dueSoon: number
  completed: number
  inProgress: number
  blocked: number
  byPriority: Record<TaskPriority, number>
  byCategory: Record<TaskCategory, number>
  byAssignee: Record<string, number>
  productivity: number
  averageCompletionTime: number
  complianceRate: number
}

export interface TaskFilters {
  search: string
  status: TaskStatus[]
  priority: TaskPriority[]
  category: TaskCategory[]
  assignee: string[]
  client: string[]
  dateRange: {
    start?: string
    end?: string
  }
  overdue: boolean
  compliance: boolean
  tags: string[]
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  category: TaskCategory
  dueDate: string
  estimatedHours: number
  assigneeId?: string
  clientId?: string
  bookingId?: string
  tags: string[]
  complianceRequired: boolean
  complianceDeadline?: string
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus
  completionPercentage?: number
  actualHours?: number
}

// lib/tasks/constants.ts
export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' }
]

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-gray-600 bg-gray-50' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600 bg-blue-50' },
  { value: 'review', label: 'Review', color: 'text-purple-600 bg-purple-50' },
  { value: 'completed', label: 'Completed', color: 'text-green-600 bg-green-50' },
  { value: 'blocked', label: 'Blocked', color: 'text-red-600 bg-red-50' }
]

export const TASK_CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'booking', label: 'Booking', icon: 'Calendar' },
  { value: 'client', label: 'Client', icon: 'User' },
  { value: 'system', label: 'System', icon: 'Settings' },
  { value: 'finance', label: 'Finance', icon: 'DollarSign' },
  { value: 'compliance', label: 'Compliance', icon: 'AlertTriangle' },
  { value: 'marketing', label: 'Marketing', icon: 'TrendingUp' }
]

export const VIEW_MODES: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'list', label: 'List', icon: 'List' },
  { value: 'board', label: 'Board', icon: 'Columns' },
  { value: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { value: 'table', label: 'Table', icon: 'Table' }
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'category', label: 'Category' }
]

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: [],
  priority: [],
  category: [],
  assignee: [],
  client: [],
  dateRange: {},
  overdue: false,
  compliance: false,
  tags: []
}
