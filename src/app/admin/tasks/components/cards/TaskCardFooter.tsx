import React from 'react'
import { Button } from '@/components/ui/button'
import type { Task } from '@/lib/tasks/types'

interface TaskCardFooterProps {
  task: Task
  onStatusChange?: (taskId: string, status: Task['status']) => void
  onEdit?: (task: Task) => void
  onView?: (task: Task) => void
}

export const TaskCardFooter: React.FC<TaskCardFooterProps> = ({ task, onStatusChange, onEdit, onView }) => {
  return (
    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
      <div className="flex gap-1">
        {task.status !== 'completed' && onStatusChange && (
          <Button aria-label={`Mark ${task.title} as ${task.status === 'in_progress' ? 'completed' : 'in progress'}`} variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); const newStatus = task.status === 'in_progress' ? 'completed' : 'in_progress'; onStatusChange(task.id, newStatus) }}>
            Complete
          </Button>
        )}
        {onEdit && (
          <Button aria-label={`Edit ${task.title}`} variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); onEdit(task) }}>
            Edit
          </Button>
        )}
      </div>
      {onView && (
        <Button aria-label={`View details for ${task.title}`} variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); onView(task) }}>
          Details
        </Button>
      )}
    </div>
  )
}
