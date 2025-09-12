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
  position?: number
}

export interface TaskItem {
  id: string
  title: string
  dueAt: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | string
  boardStatus?: TaskStatus
  position?: number
  assigneeId?: string | null
  createdAt?: string
  updatedAt?: string
}
