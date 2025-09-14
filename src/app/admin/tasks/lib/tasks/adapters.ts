// API ⇄ UI adapters for the Task Management module (dev workspace)

// Import UI types from the temp workspace
import type {
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  User,
} from '../../task-types'

// Prisma/API enums and payload shapes used by src/app/api/admin/tasks
export type ApiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type ApiTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE'

export interface ApiTask {
  id: string
  title: string
  dueAt: string | null
  priority: ApiTaskPriority
  status: ApiTaskStatus
  assigneeId: string | null
  createdAt: string
  updatedAt: string
}

// Priority mapping
export const mapApiPriorityToUi = (p: ApiTaskPriority): TaskPriority => {
  switch (p) {
    case 'LOW':
      return 'low'
    case 'MEDIUM':
      return 'medium'
    case 'HIGH':
      return 'high'
    default:
      return 'medium'
  }
}

export const mapUiPriorityToApi = (p: TaskPriority): ApiTaskPriority => {
  switch (p) {
    case 'low':
      return 'LOW'
    case 'medium':
      return 'MEDIUM'
    case 'high':
    case 'critical': // collapse critical into HIGH at the API layer
      return 'HIGH'
    default:
      return 'MEDIUM'
  }
}

// Status mapping
export const mapApiStatusToUi = (s: ApiTaskStatus): TaskStatus => {
  switch (s) {
    case 'OPEN':
      return 'pending'
    case 'IN_PROGRESS':
      return 'in_progress'
    case 'DONE':
      return 'completed'
    default:
      return 'pending'
  }
}

export const mapUiStatusToApi = (s: TaskStatus): ApiTaskStatus => {
  switch (s) {
    case 'pending':
      return 'OPEN'
    case 'in_progress':
    case 'review': // map review to IN_PROGRESS for API
    case 'blocked': // map blocked to IN_PROGRESS for API
      return 'IN_PROGRESS'
    case 'completed':
      return 'DONE'
    default:
      return 'OPEN'
  }
}

// Convert API task to UI task shape
export const apiTaskToUiTask = (t: ApiTask, usersById?: Record<string, User>): Task => {
  const uiPriority = mapApiPriorityToUi(t.priority)
  const uiStatus = mapApiStatusToUi(t.status)

  const assignee = t.assigneeId && usersById ? usersById[t.assigneeId] : undefined

  return {
    id: t.id,
    title: t.title,
    description: undefined,
    priority: uiPriority,
    status: uiStatus,
    category: 'system',
    dueDate: t.dueAt ?? new Date(t.updatedAt || t.createdAt).toISOString(),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    completedAt: uiStatus === 'completed' ? t.updatedAt : undefined,
    estimatedHours: 0,
    actualHours: undefined,
    assignee,
    assigneeId: t.assigneeId ?? undefined,
    collaborators: [],
    createdBy: assignee || { id: 'system', name: 'System', email: 'system@local' },
    completionPercentage: uiStatus === 'completed' ? 100 : 0,
    progress: [],
    dependencies: [],
    blockedBy: undefined,
    clientId: undefined,
    client: undefined,
    bookingId: undefined,
    booking: undefined,
    revenueImpact: undefined,
    complianceRequired: false,
    complianceDeadline: undefined,
    tags: [],
    customFields: {},
    attachments: [],
    comments: [],
    workflow: undefined,
    template: undefined,
    recurring: undefined,
    reminders: [],
    watchers: [],
  }
}

// Create payload mapping (UI → API)
export interface ApiCreateTaskInput {
  title: string
  dueAt?: string | null
  priority?: ApiTaskPriority
  assigneeId?: string | null
}

export const uiCreateToApi = (input: CreateTaskInput): ApiCreateTaskInput => {
  return {
    title: input.title,
    dueAt: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    priority: mapUiPriorityToApi(input.priority),
    assigneeId: input.assigneeId ?? null,
  }
}

// Update payload mapping (UI → API)
export interface ApiUpdateTaskInput {
  title?: string
  status?: ApiTaskStatus
  priority?: ApiTaskPriority
  dueAt?: string | null
  assigneeId?: string | null
}

export const uiUpdateToApi = (updates: UpdateTaskInput & { status?: TaskStatus }): ApiUpdateTaskInput => {
  const out: ApiUpdateTaskInput = {}
  if (updates.title !== undefined) out.title = updates.title
  if (updates.priority !== undefined) out.priority = mapUiPriorityToApi(updates.priority)
  if (updates.status !== undefined) out.status = mapUiStatusToApi(updates.status)
  if (updates.dueDate !== undefined) out.dueAt = updates.dueDate ? new Date(updates.dueDate).toISOString() : null
  if (updates.assigneeId !== undefined) out.assigneeId = updates.assigneeId ?? null
  return out
}

// Collection mapping helpers
export const apiTasksToUi = (items: ApiTask[], usersById?: Record<string, User>): Task[] =>
  items.map(t => apiTaskToUiTask(t, usersById))
