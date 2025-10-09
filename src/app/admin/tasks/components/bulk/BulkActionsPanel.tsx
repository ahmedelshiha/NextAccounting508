'use client'

import React from 'react'
import SharedBulkActionsPanel from '@/components/common/bulk/BulkActionsPanel'
import { apiFetch } from '@/lib/api'

export default function BulkActionsPanel({ selectedIds, onClear, onRefresh }: { selectedIds: string[]; onClear: () => void; onRefresh: () => void }) {
  const bulkAction = async (action: string, updates?: any) => {
    if (!selectedIds.length) return
    if (!confirm(`Run '${action}' for ${selectedIds.length} tasks?`)) return
    const res = await apiFetch('/api/admin/tasks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, taskIds: selectedIds, updates }) })
    if (!res.ok) {
      let detail = ''
      try { const json = await res.json(); detail = json?.error || json?.message || JSON.stringify(json) } catch { detail = `${res.status} ${res.statusText}` }
      throw new Error(detail || 'Bulk action failed')
    }
    onRefresh()
    onClear()
  }

  return (
    <SharedBulkActionsPanel
      mode="tasks"
      selectedIds={selectedIds}
      onClear={onClear}
      onMarkComplete={() => bulkAction('update', { status: 'DONE' })}
      onAssign={(assigneeId) => bulkAction('assign', { assigneeId })}
      onDelete={() => bulkAction('delete')}
    />
  )
}
