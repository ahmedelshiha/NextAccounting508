'use client'

import React, { useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Props {
  selectedIds: string[]
  onClear: () => void
  onRefresh: () => void
}

export default function BulkActionsPanel({ selectedIds, onClear, onRefresh }: Props) {
  const [loading, setLoading] = useState(false)

  const bulkAction = async (action: string, updates?: any) => {
    if (!selectedIds.length) return
    if (!confirm(`Run '${action}' for ${selectedIds.length} tasks?`)) return
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/tasks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, taskIds: selectedIds, updates }) })
      if (!res.ok) {
        let detail = ''
        try { const json = await res.json(); detail = json?.error || json?.message || JSON.stringify(json) } catch { detail = `${res.status} ${res.statusText}` }
        throw new Error(detail || 'Bulk action failed')
      }
      alert('Bulk action succeeded')
      onRefresh()
      onClear()
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Bulk action failed'
      alert(msg)
    } finally { setLoading(false) }
  }

  const handleDelete = () => bulkAction('delete')
  // DB uses TaskStatus enum: OPEN, IN_PROGRESS, DONE
  const handleMarkComplete = () => bulkAction('update', { status: 'DONE' })
  const handleAssign = async () => {
    const assigneeId = prompt('Assignee ID (enter user id or leave empty to unassign)')
    if (assigneeId === null) return
    await bulkAction('assign', { assigneeId: assigneeId || null })
  }

  return (
    <div className="bg-white border rounded p-3 flex items-center gap-3">
      <div className="text-sm text-gray-700">{selectedIds.length} selected</div>
      <button onClick={handleMarkComplete} disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Mark Complete</button>
      <button onClick={handleAssign} disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Assign</button>
      <button onClick={handleDelete} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
      <button onClick={onClear} disabled={loading} className="ml-auto px-2 py-1 bg-gray-100 rounded text-sm">Clear</button>
    </div>
  )
}
