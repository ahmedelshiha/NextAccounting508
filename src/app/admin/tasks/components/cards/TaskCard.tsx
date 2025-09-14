import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Task } from '@/lib/tasks/types'
import { isOverdue } from '@/lib/tasks/utils'
import { TaskCardActions } from './TaskCardActions'
import { TaskCardHeader } from './TaskCardHeader'
import { TaskCardContent } from './TaskCardContent'
import { TaskCardFooter } from './TaskCardFooter'

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

const TaskCard: React.FC<TaskCardProps> = ({ task, isSelected = false, onSelect, onEdit, onDelete, onStatusChange, onView, showFullDetails = false, className = '' }) => {
  const overdue = isOverdue(task.dueDate, task.status)
  return (
    <Card
      role="article"
      aria-labelledby={`task-title-${task.id}`}
      tabIndex={0}
      className={`task-card group relative transition-all duration-200 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${overdue ? 'border-red-200 bg-red-50' : 'hover:border-gray-300'} ${isSelected ? 'ring-2 ring-blue-500' : ''} ${className}`}
      onClick={() => onSelect?.(task.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(task.id) } }}
    >
      <TaskCardActions task={task} onEdit={onEdit} onDelete={onDelete} />
      <CardHeader className="pb-3"><TaskCardHeader task={task} /></CardHeader>
      <CardContent className="pt-0">
        <TaskCardContent task={task} showFullDetails={showFullDetails} />
        <TaskCardFooter task={task} onStatusChange={onStatusChange} onEdit={onEdit} onView={onView} />
      </CardContent>
    </Card>
  )
}

export default TaskCard
