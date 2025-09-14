import React from 'react'
import TaskForm from '../forms/TaskForm'

interface Props {
  open: boolean
  onClose: () => void
  task?: any
  onSave: (data: any) => Promise<void>
  availableUsers?: { id: string; name: string }[]
}

export default function TaskEditModal({ open, onClose, task, onSave, availableUsers = [] }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow max-w-2xl w-full p-6 z-10">
        <h2 className="text-lg font-semibold mb-3">{task ? 'Edit Task' : 'New Task'}</h2>
        <TaskForm task={task} mode={task ? 'edit' : 'create'} availableUsers={availableUsers} onSave={async (d) => { await onSave(d); onClose() }} onCancel={onClose} />
      </div>
    </div>
  )
}
