import React from 'react'
import { Button } from '@/components/ui/button'

export default function BulkActionsPanel({ selectedIds, onClear, onRefresh }: { selectedIds: string[]; onClear?: () => void; onRefresh?: () => void }) {
  const doAction = async (action: string) => {
    try {
      const res = await fetch('/api/admin/tasks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, taskIds: selectedIds }) })
      if (!res.ok) throw new Error('Bulk failed')
      alert('Action completed')
      onRefresh?.()
      onClear?.()
    } catch (e) {
      console.error(e)
      alert('Bulk action failed')
    }
  }

  return (
    <div className="p-3 bg-white border rounded flex items-center gap-3">
      <div className="text-sm">{selectedIds.length} selected</div>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" onClick={() => doAction('assign')}>Assign</Button>
        <Button variant="outline" size="sm" onClick={() => doAction('update')}>Update</Button>
        <Button variant="destructive" size="sm" onClick={() => doAction('delete')}>Delete</Button>
      </div>
    </div>
  )
}
