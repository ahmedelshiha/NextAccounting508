'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import AssigneeSelector from './assignee-selector'
import DependencyManager from './dependency-manager'
import type { Task, TaskStatus } from './types'

interface TaskEditDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskEditDialog({ task, open, onOpenChange, onSave, onDelete, availableTasks }: TaskEditDialogProps & { availableTasks?: { id: string; title: string }[] }) {
  const [form, setForm] = useState<Partial<Task> | null>(null)

  useEffect(() => {
    setForm(task ? { ...task } : null)
  }, [task])

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        {form && (
          <form onSubmit={async (e) => { e.preventDefault(); await onSave(task.id, form as Partial<Task>); onOpenChange(false) }} className="space-y-4">
            <div>
              <label className="text-sm">Title</label>
              <input className="w-full border rounded px-2 py-1" value={form.title as string} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Description</label>
              <textarea className="w-full border rounded px-2 py-1" value={(form.description as string) || ''} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Due date</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={form.dueDate ? (form.dueDate as string).split('T')[0] : ''} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Priority</label>
                <select className="w-full border rounded px-2 py-1" value={form.priority as Task['priority']} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), priority: e.target.value as Task['priority'] }))}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Est. hours</label>
                <input className="w-full border rounded px-2 py-1" type="number" step="0.25" value={form.estimatedHours ?? 0} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), estimatedHours: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm">Actual hours</label>
                <input className="w-full border rounded px-2 py-1" type="number" step="0.25" value={form.actualHours ?? ''} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), actualHours: e.target.value === '' ? undefined : Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <label className="text-sm">Assignee</label>
              <AssigneeSelector value={(form.assignee as string) ?? ''} onChange={(id) => setForm((s) => ({ ...(s as Partial<Task>), assignee: id || undefined }))} />
            </div>

            <div>
              <label className="text-sm">Tags (comma separated)</label>
              <input className="w-full border rounded px-2 py-1" value={Array.isArray(form.tags) ? form.tags.join(', ') : ''} onChange={(e) => setForm((s) => ({ ...(s as Partial<Task>), tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} />
            </div>

            <div>
              <label className="text-sm">Dependencies</label>
              <div className="mt-1">
                <DependencyManager
                  available={availableTasks?.filter((x) => x.id !== task.id) || []}
                  value={form.dependencies || []}
                  onChange={(deps) => setForm((s) => ({ ...(s as Partial<Task>), dependencies: deps }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="destructive" type="button" onClick={async () => { if (confirm('Delete this task?')) { await onDelete(task.id); onOpenChange(false) } }}>Delete</Button>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
