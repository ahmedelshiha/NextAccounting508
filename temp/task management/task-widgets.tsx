import React from 'react'
import { 
  Calendar,
  Clock,
  User,
  Flag,
  Target,
  AlertCircle,
  DollarSign,
  AlertTriangle,
  Settings,
  TrendingUp,
  FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Task, TaskPriority, TaskStatus, TaskCategory } from './types'
import { getPriorityColor, getStatusColor, formatDueDate, getProgressColor, isOverdue } from './utils'

// TaskProgress Component
interface TaskProgressProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ 
  percentage, 
  size = 'md', 
  showLabel = true 
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  )
}

// TaskPriority Component
interface TaskPriorityProps {
  priority: TaskPriority
  variant?: 'badge' | 'icon' | 'full'
  size?: 'sm' | 'md'
}

export const TaskPriority: React.FC<TaskPriorityProps> = ({ 
  priority, 
  variant = 'badge',
  size = 'md'
}) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  
  if (variant === 'icon') {
    return (
      <div className={`p-1 rounded ${getPriorityColor(priority)}`}>
        <Flag className={iconSize} />
      </div>
    )
  }
  
  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
        <Flag className="h-3 w-3" />
        <span className="capitalize">{priority}</span>
      </div>
    )
  }
  
  return (
    <Badge variant="outline" className={`text-xs capitalize ${getPriorityColor(priority)}`}>
      {priority}
    </Badge>
  )
}

// TaskStatus Component
interface TaskStatusProps {
  status: TaskStatus
  variant?: 'badge' | 'dot' | 'full'
}

export const TaskStatus: React.FC<TaskStatusProps> = ({ 
  status, 
  variant = 'badge' 
}) => {
  if (variant === 'dot') {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status).replace('bg-', 'bg-').split(' ')[1]}`} />
        <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
      </div>
    )
  }
  
  if (variant === 'full') {
    return (
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {status.replace('_', ' ')}
      </div>
    )
  }
  
  return (
    <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

// TaskCategory Component
interface TaskCategoryProps {
  category: TaskCategory
  variant?: 'badge' | 'icon' | 'full'
}

export const TaskCategory: React.FC<TaskCategoryProps> = ({ 
  category, 
  variant = 'badge' 
}) => {
  const getIcon = (cat: TaskCategory) => {
    const icons = {
      finance: DollarSign,
      compliance: AlertTriangle,
      client: User,
      system: Settings,
      marketing: TrendingUp,
      booking: Calendar
    }
    return icons[cat] || FileText
  }
  
  const Icon = getIcon(category)
  
  if (variant === 'icon') {
    return (
      <div className="p-1 rounded bg-gray-100">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
    )
  }
  
  if (variant === 'full') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
        <Icon className="h-3 w-3" />
        <span className="capitalize">{category}</span>
      </div>
    )
  }
  
  return (
    <Badge variant="secondary" className="text-xs capitalize">
      {category}
    </Badge>
  )
}

// TaskAssignee Component
interface TaskAssigneeProps {
  assignee?: Task['assignee']
  variant?: 'avatar' | 'name' | 'full'
  size?: 'sm' | 'md'
}

export const TaskAssignee: React.FC<TaskAssigneeProps> = ({ 
  assignee, 
  variant = 'full',
  size = 'md' 
}) => {
  if (!assignee) {
    return (
      <div className="flex items-center gap-1 text-gray-500 text-xs">
        <User className="h-3 w-3" />
        <span>Unassigned</span>
      </div>
    )
  }
  
  const avatarSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  
  if (variant === 'avatar') {
    return (
      <div className={`${avatarSize} rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium`}>
        {assignee.name.charAt(0).toUpperCase()}
      </div>
    )
  }
  
  if (variant === 'name') {
    return <span className="text-sm">{assignee.name}</span>
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${avatarSize} rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium`}>
        {assignee.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm">{assignee.name}</span>
    </div>
  )
}

// TaskDueDate Component
interface TaskDueDateProps {
  dueDate: string
  status: TaskStatus
  variant?: 'full' | 'compact' | 'relative'
}

export const TaskDueDate: React.FC<TaskDueDateProps> = ({ 
  dueDate, 
  status, 
  variant = 'full' 
}) => {
  const overdue = isOverdue(dueDate, status)
  const dateStr = variant === 'relative' ? formatDueDate(dueDate) : new Date(dueDate).toLocaleDateString()
  
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
        <Calendar className="h-3 w-3" />
        <span>{dateStr}</span>
        {overdue && <AlertCircle className="h-3 w-3" />}
      </div>
    )
  }
  
  return (
    <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
      <Calendar className="h-3 w-3" />
      <span>{dateStr}</span>
      {overdue && <AlertCircle className="h-3 w-3" />}
    </div>
  )
}

// TaskTags Component
interface TaskTagsProps {
  tags: string[]
  maxVisible?: number
}

export const TaskTags: React.FC<TaskTagsProps> = ({ tags, maxVisible = 3 }) => {
  if (!tags.length) return null
  
  const visibleTags = tags.slice(0, maxVisible)
  const remainingCount = tags.length - maxVisible
  
  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map(tag => (
        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs px-1 py-0">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}

// TaskMetrics Component
interface TaskMetricsProps {
  task: Task
  showRevenue?: boolean
  showTime?: boolean
  showCompliance?: boolean
}

export const TaskMetrics: React.FC<TaskMetricsProps> = ({ 
  task, 
  showRevenue = true, 
  showTime = true, 
  showCompliance = true 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
      {showTime && (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{task.estimatedHours}h est.</span>
        </div>
      )}
      
      <TaskDueDate dueDate={task.dueDate} status={task.status} variant="compact" />
      
      <div className="flex items-center gap-1">
        <User className="h-3 w-3" />
        <span>{task.assignee?.name || 'Unassigned'}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Target className="h-3 w-3" />
        <span className="capitalize">{task.category}</span>
      </div>
      
      {showRevenue && task.revenueImpact && (
        <div className="col-span-2 flex items-center gap-1 text-green-600 bg-green-50 rounded p-2">
          <DollarSign className="h-3 w-3" />
          <span>Revenue Impact: ${task.revenueImpact}</span>
        </div>
      )}
      
      {showCompliance && task.complianceRequired && (
        <div className="col-span-2 flex items-center gap-1 text-orange-600 bg-orange-50 rounded p-2">
          <AlertTriangle className="h-3 w-3" />
          <span>Compliance Required</span>
        </div>
      )}
    </div>
  )
}