import React from 'react'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task } from '../../task-types'

interface TaskCardActionsProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onDuplicate?: (task: Task) => void
  onAssign?: (task: Task) => void
}

export const TaskCardActions: React.FC<TaskCardActionsProps> = ({ task, onEdit, onDelete, onDuplicate, onAssign }) => {
  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
        <MoreVertical className="h-3 w-3" />
      </Button>
    </div>
  )
}
