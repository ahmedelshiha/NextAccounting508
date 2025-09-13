import React from 'react'
import { DollarSign, User, Calendar, Target, AlertCircle, Flag } from 'lucide-react'
import { CardTitle } from '@/components/ui/card'
import type { Task } from '../../task-types'
import { isOverdue } from '../../task-utils'
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
          <CardTitle className="text-sm font-medium line-clamp-1 mb-1">{task.title}</CardTitle>
          <div className="flex items-center gap-2">
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
