import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

export function TaskAssignModal({ open, onClose, onAssign, availableUsers = [] }: any) {
  const [assigneeId, setAssigneeId] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow max-w-md w-full p-6 z-10">
        <h3 className="text-lg font-semibold">Assign task</h3>
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full border rounded px-2 py-1 mt-3">
          <option value="">Unassigned</option>
          {availableUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onAssign(assigneeId); onClose() }}>Assign</Button>
        </div>
      </div>
    </div>
  )
}

export function BulkActionsModal({ open, onClose, onApply, options = [] }: any) {
  const [selected, setSelected] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow max-w-md w-full p-6 z-10">
        <h3 className="text-lg font-semibold">Bulk actions</h3>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border rounded px-2 py-1 mt-3">
          <option value="">Select action</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onApply(selected); onClose() }} disabled={!selected}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
