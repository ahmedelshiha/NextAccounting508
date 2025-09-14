import React from 'react'
import { Button } from '@/components/ui/button'
import CommentsPanel from '../../components/comments/CommentsPanel'

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
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <div><strong>Description:</strong><div className="mt-1">{task?.description || '—'}</div></div>
          <div><strong>Priority:</strong> {task?.priority || '—'}</div>
          <div><strong>Status:</strong> {task?.status || '—'}</div>
          <div><strong>Assignee:</strong> {task?.assignee?.name ?? task?.assigneeId ?? 'Unassigned'}</div>
          <div><strong>Due:</strong> {task?.dueDate ? new Date(task.dueDate).toLocaleString() : '—'}</div>
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
