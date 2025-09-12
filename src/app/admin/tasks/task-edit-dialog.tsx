'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import AssigneeSelector from './assignee-selector'

interface TaskEditDialogProps {
  task: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Record<string, any>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

// augment availableTasks prop in component usage

export default function TaskEditDialog({ task, open, onOpenChange, onSave, onDelete, availableTasks }: TaskEditDialogProps & { availableTasks?: { id: string; title: string }[] }) {
  const [form, setForm] = useState<any>(null)

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
          <form onSubmit={async (e) => { e.preventDefault(); await onSave(task.id, form); onOpenChange(false) }} className="space-y-4">
            <div>
              <label className="text-sm">Title</label>
              <input className="w-full border rounded px-2 py-1" value={form.title} onChange={(e) => setForm((s: any) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Description</label>
              <textarea className="w-full border rounded px-2 py-1" value={form.description || ''} onChange={(e) => setForm((s: any) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Due date</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={form.dueDate ? form.dueDate.split('T')[0] : ''} onChange={(e) => setForm((s: any) => ({ ...s, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Priority</label>
                <select className="w-full border rounded px-2 py-1" value={form.priority} onChange={(e) => setForm((s: any) => ({ ...s, priority: e.target.value }))}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Est. hours</label>
                <input className="w-full border rounded px-2 py-1" type="number" step="0.25" value={form.estimatedHours ?? 0} onChange={(e) => setForm((s: any) => ({ ...s, estimatedHours: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm">Actual hours</label>
                <input className="w-full border rounded px-2 py-1" type="number" step="0.25" value={form.actualHours ?? ''} onChange={(e) => setForm((s: any) => ({ ...s, actualHours: e.target.value === '' ? undefined : Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <label className="text-sm">Assignee</label>
              <AssigneeSelector value={form.assignee ?? ''} onChange={(id) => setForm((s: any) => ({ ...s, assignee: id }))} />
            </div>

            <div>
              <label className="text-sm">Tags (comma separated)</label>
              <input className="w-full border rounded px-2 py-1" value={(form.tags || []).join(', ')} onChange={(e) => setForm((s: any) => ({ ...s, tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} />
            </div>

            <div>
              <label className="text-sm">Dependencies</label>
              <select multiple className="w-full border rounded px-2 py-1" value={(form.dependencies || [])} onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o: any) => o.value)
                setForm((s: any) => ({ ...s, dependencies: opts }))
              }}>
                {(availableTasks || []).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
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
