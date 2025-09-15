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
      <div className="flex gap-2">
        {task.status !== 'completed' && onStatusChange && (
          <Button
            aria-label={`Advance ${task.title}`}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              const next = task.status === 'in_progress' ? 'completed' : 'in_progress'
              onStatusChange(task.id, next)
            }}
            className="px-3 py-1 text-sm"
          >
            {task.status === 'in_progress' ? 'Complete' : 'Start'}
          </Button>
        )}
        {onEdit && (
          <Button aria-label={`Edit ${task.title}`} variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(task) }} className="px-3 py-1 text-sm">
            Edit
          </Button>
        )}
      </div>
      {onView && (
        <Button aria-label={`View details for ${task.title}`} variant="ghost" onClick={(e) => { e.stopPropagation(); onView(task) }} className="px-3 py-1 text-sm">
          Details
        </Button>
      )}
    </div>
  )
}
