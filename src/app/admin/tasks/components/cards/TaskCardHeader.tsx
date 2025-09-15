import React from 'react'
import { DollarSign, User, Calendar, Target, AlertCircle, Flag } from 'lucide-react'
import { CardTitle } from '@/components/ui/card'
import type { Task } from '@/lib/tasks/types'
import { isOverdue, formatDueDate } from '@/lib/tasks/utils'
import { TaskPriority, TaskStatus as TaskStatusBadge } from '../widgets'

interface TaskCardHeaderProps { task: Task }

export const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ task }) => {
  const CategoryIcon = task.category === 'finance' ? DollarSign : task.category === 'client' ? User : task.category === 'booking' ? Calendar : Target
  const overdue = isOverdue(task.dueDate, task.status)
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TaskPriority priority={task.priority} variant="icon" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {task.assignee?.email ? (
              <img src={task.assignee?.avatar || `/api/placeholder/32/32`} alt={task.assignee?.name || 'Assignee'} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">U</div>
            )}
            <div className="min-w-0">
              <CardTitle id={`task-title-${task.id}`} className="text-sm font-medium line-clamp-1 mb-0">{task.title}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span className="truncate">{task.assignee?.name || 'Unassigned'}</span>
                <span>•</span>
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TaskPriority priority={task.priority} />
            <TaskStatusBadge status={task.status} />
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
