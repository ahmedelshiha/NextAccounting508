'use client'

import SharedBulkActionsPanel from '@/components/common/bulk/BulkActionsPanel'
import React from 'react'

export default function BulkActionsPanel({ selectedIds, actions, onClear }: { selectedIds: Array<string | number>; actions: any[]; onClear: () => void }) {
  // Map incoming actions to the shared shape
  const mapped = (actions || []).map((a: any) => ({ key: a.key, label: a.label, onClick: a.onClick, icon: a.icon, variant: a.variant }))
  return <SharedBulkActionsPanel mode="actions" selectedIds={selectedIds} actions={mapped} onClear={onClear} />
}
