import React from 'react'
import { 
  AlertCircle,
  Flag,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  Calendar,
  User,
  Target,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from './types'
import { 
  TaskProgress, 
  TaskPriority, 
  TaskStatus, 
  TaskCategory, 
  TaskAssignee, 
  TaskDueDate, 
  TaskTags,
  TaskMetrics
} from './widgets'
import { isOverdue, getCategoryIcon } from './utils'

// TaskCardSkeleton Component
export const TaskCardSkeleton: React.FC = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-3 w-full bg-gray-200 rounded mb-3" />
        <div className="h-3 w-3/4 bg-gray-200 rounded mb-4" />
        <div className="h-2 w-full bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <div className="h-8 w-20 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// TaskCardHeader Component
interface TaskCardHeaderProps {
  task: Task
}

export const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ task }) => {
  const CategoryIcon = task.category === 'finance' ? DollarSign :
                      task.category === 'client' ? User :
                      task.category === 'booking' ? Calendar :
                      Target
  
  const overdue = isOverdue(task.dueDate, task.status)
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TaskPriority priority={task.priority} variant="icon" />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm font-medium line-clamp-1 mb-1">
            {task.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TaskPriority priority={task.priority} />
            <TaskStatus status={task.status} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {overdue && <AlertCircle className="h-4 w-4 text-red-500" />}
        {task.complianceRequired && <Flag className="h-4 w-4 text-orange-500" />}
      </div>
    </div>
  )
}

// TaskCardContent Component
interface TaskCardContentProps {
  task: Task
  showFullDetails?: boolean
}

export const TaskCardContent: React.FC<TaskCardContentProps> = ({ 
  task, 
  showFullDetails = false 
}) => {
  return (
    <div className="space-y-3">
      {/* Description */}
      {task.description && (
        <p className={`text-sm text-gray-600 ${
          showFullDetails ? '' : 'line-clamp-2'
        }`}>
          {task.description}
        </p>
      )}
      
      {/* Progress */}
      <TaskProgress 
        percentage={task.completionPercentage} 
        size="md" 
        showLabel={true}
      />
      
      {/* Task Metrics */}
      <TaskMetrics 
        task={task}
        showRevenue={!!task.revenueImpact}
        showTime={true}
        showCompliance={task.complianceRequired}
      />
      
      {/* Tags */}
      <TaskTags tags={task.tags} maxVisible={showFullDetails ? 10 : 3} />
    </div>
  )
}

// TaskCardFooter Component
interface TaskCardFooterProps {
  task: Task
  onStatusChange?: (taskId: string, status: Task['status']) => void
  onEdit?: (task: Task) => void
  onView?: (task: Task) => void
}

export const TaskCardFooter: React.FC<TaskCardFooterProps> = ({ 
  task, 
  onStatusChange,
  onEdit,
  onView 
}) => {
  return (
    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
      <div className="flex gap-1">
        {task.status !== 'completed' && onStatusChange && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation()
              const newStatus = task.status === 'in_progress' ? 'completed' : 'in_progress'
              onStatusChange(task.id, newStatus)
            }}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {task.status === 'in_progress' ? 'Complete' : 'Start'}
          </Button>
        )}
        
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      
      {onView && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onView(task)
          }}
        >
          <Eye className="h-3 w-3 mr-1" />
          Details
        </Button>
      )}
    </div>
  )
}

// TaskCardActions Component
interface TaskCardActionsProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onDuplicate?: (task: Task) => void
  onAssign?: (task: Task) => void
}

export const TaskCardActions: React.FC<TaskCardActionsProps> = ({
  task,
  onEdit,
  onDelete,
  onDuplicate,
  onAssign
}) => {
  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical className="h-3 w-3" />
      </Button>
      {/* Dropdown menu would be implemented here */}
    </div>
  )
}

// Main TaskCard Component
interface TaskCardProps {
  task: Task
  isSelected?: boolean
  onSelect?: (taskId: string) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: Task['status']) => void
  onView?: (task: Task) => void
  showFullDetails?: boolean
  className?: string
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  showFullDetails = false,
  className = ''
}) => {
  const overdue = isOverdue(task.dueDate, task.status)
  
  return (
    <Card 
      className={`
        group relative transition-all duration-200 hover:shadow-md cursor-pointer
        ${overdue ? 'border-red-200 bg-red-50' : 'hover:border-gray-300'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${className}
      `}
      onClick={() => onSelect?.(task.id)}
    >
      <TaskCardActions
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      
      <CardHeader className="pb-3">
        <TaskCardHeader task={task} />
      </CardHeader>
      
      <CardContent className="pt-0">
        <TaskCardContent task={task} showFullDetails={showFullDetails} />
        
        <TaskCardFooter
          task={task}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onView={onView}
        />
      </CardContent>
    </Card>
  )
}