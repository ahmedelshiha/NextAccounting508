'use client'

import React from 'react'
import SharedBulkActionsPanel from '@/components/common/bulk/BulkActionsPanel'
import { BulkAction as ServiceBulkAction } from '@/types/services'

interface BulkActionsPanelProps {
  selectedIds: string[]
  onClearSelection: () => void
  onBulkAction: (action: ServiceBulkAction) => Promise<void>
  categories: string[]
  loading?: boolean
}

export function BulkActionsPanel({ selectedIds, onClearSelection, onBulkAction, categories, loading }: BulkActionsPanelProps) {
  return (
    <SharedBulkActionsPanel
      mode="service"
      selectedIds={selectedIds}
      categories={categories}
      onClear={onClearSelection}
      onBulkAction={onBulkAction}
      loading={loading}
    />
  )
}

export default BulkActionsPanel
