import React from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import type { TaskStatus } from '../../task-types'
import { isOverdue, formatDueDate } from '../../task-utils'

interface TaskDueDateProps { dueDate: string; status: TaskStatus; variant?: 'full' | 'compact' | 'relative' }

export const TaskDueDate: React.FC<TaskDueDateProps> = ({ dueDate, status, variant = 'full' }) => {
  const overdue = isOverdue(dueDate, status)
  const dateStr = variant === 'relative' ? formatDueDate(dueDate) : new Date(dueDate).toLocaleDateString()
  if (variant === 'compact') return (<div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600' : 'text-gray-600'}`}><Calendar className="h-3 w-3" /><span>{dateStr}</span>{overdue && <AlertCircle className="h-3 w-3" />}</div>)
  return (<div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}><Calendar className="h-3 w-3" /><span>{dateStr}</span>{overdue && <AlertCircle className="h-3 w-3" />}</div>)
}
