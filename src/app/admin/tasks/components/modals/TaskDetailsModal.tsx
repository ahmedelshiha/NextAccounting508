import React from 'react'
import { Button } from '@/components/ui/button'
import CommentsPanel from '../comments/CommentsPanel'
import TaskWatchers from '../widgets/TaskWatchers'
import TaskReminders from '../widgets/TaskReminders'
import TaskDependencies from '../widgets/TaskDependencies'

interface Props {
  open: boolean
  onClose: () => void
  task?: any
}

export default function TaskDetailsModal({ open, onClose, task }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow max-w-2xl w-full p-6 z-10">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">{task?.title || 'Task details'}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          <div><strong>Description:</strong><div className="mt-1">{task?.description || '—'}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>Priority:</strong> <span className="ml-1">{task?.priority || '—'}</span></div>
            <div><strong>Status:</strong> <span className="ml-1">{task?.status || '—'}</span></div>
            <div><strong>Assignee:</strong> <span className="ml-1">{task?.assignee?.name ?? task?.assigneeId ?? 'Unassigned'}</span></div>
            <div><strong>Due:</strong> <span className="ml-1">{task?.dueDate ? new Date(task.dueDate).toLocaleString() : '—'}</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="font-semibold text-gray-900 mb-1">Watchers</div>
              <TaskWatchers watchers={task?.watchers || []} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Reminders</div>
              <TaskReminders reminders={task?.reminders || []} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Dependencies</div>
              <TaskDependencies dependencies={task?.dependencies || []} />
            </div>
          </div>
        </div>
        {!!task?.id && (
          <div className="mt-6">
            <CommentsPanel taskId={task.id} />
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
