import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TaskFormProps {
  task?: any
  mode: 'create' | 'edit'
  availableUsers?: { id: string; name: string }[]
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export default function TaskForm({ task, mode, availableUsers = [], onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await onSave({ title: title.trim(), description: description.trim(), priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, assigneeId: assigneeId || undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Due date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Assignee</label>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="">Unassigned</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}</Button>
      </div>
    </form>
  )
}
