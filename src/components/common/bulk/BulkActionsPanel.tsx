'use client'

import React, { ReactNode, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateBulkAction } from '@/lib/services/utils'
import { ServiceBulkActionType, BulkAction as ServiceBulkAction } from '@/types/services'

type ActionButton = {
  key: string
  label: string
  onClick: (selectedIds: Array<string | number>) => void
  icon?: ReactNode
  variant?: 'default' | 'destructive'
}


export default function SharedBulkActionsPanel(props: {
  selectedIds: Array<string | number>
  // service mode
  mode?: 'service' | 'actions' | 'tasks'
  categories?: string[]
  onClear?: () => void
  onBulkAction?: (a: ServiceBulkAction) => Promise<void>
  loading?: boolean
  // actions mode
  actions?: ActionButton[]
  // tasks mode
  onMarkComplete?: () => Promise<void>
  onAssign?: (assigneeId: string | null) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const {
    selectedIds,
    mode = 'actions',
    categories = [],
    onClear,
    onBulkAction,
    loading = false,
    actions = [],
    onMarkComplete,
    onAssign,
    onDelete,
  } = props

  const [selectedAction, setSelectedAction] = useState<ServiceBulkActionType | ''>('')
  const [categoryValue, setCategoryValue] = useState('')
  const [priceValue, setPriceValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!selectedIds || selectedIds.length === 0) return null

  // Actions mode: simple buttons list
  if (mode === 'actions') {
    return (
      <div className="bulk-actions-panel flex items-center justify-between">
        <div className="bulk-summary text-sm text-gray-700">{selectedIds.length} selected</div>
        <div className="bulk-actions flex items-center gap-2">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => a.onClick(selectedIds)}
              className={`px-3 py-1.5 text-sm rounded border ${a.variant === 'destructive' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              {a.icon}
              {a.label}
            </button>
          ))}
          <button onClick={onClear} className="px-3 py-1.5 text-sm rounded text-white bg-green-600 hover:bg-green-700">Clear</button>
        </div>
      </div>
    )
  }

  // Tasks mode: dedicated action buttons
  if (mode === 'tasks') {
    const handleAssign = async () => {
      const assigneeId = prompt('Assignee ID (enter user id or leave empty to unassign)')
      if (assigneeId === null) return
      if (!onAssign) return
      try {
        setIsProcessing(true)
        await onAssign(assigneeId || null)
      } finally {
        setIsProcessing(false)
      }
    }

    const handleMarkComplete = async () => {
      if (!onMarkComplete) return
      try { setIsProcessing(true); await onMarkComplete() } finally { setIsProcessing(false) }
    }

    const handleDelete = async () => {
      if (!onDelete) return
      if (!confirm(`Run 'delete' for ${selectedIds.length} items?`)) return
      try { setIsProcessing(true); await onDelete() } finally { setIsProcessing(false) }
    }

    return (
      <div className="bulk-actions-tasks bg-white border rounded p-3 flex items-center gap-3">
        <div className="text-sm text-gray-700">{selectedIds.length} selected</div>
        <button onClick={handleMarkComplete} disabled={isProcessing || loading} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Mark Complete</button>
        <button onClick={handleAssign} disabled={isProcessing || loading} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Assign</button>
        <button onClick={handleDelete} disabled={isProcessing || loading} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
        <button onClick={onClear} disabled={isProcessing || loading} className="ml-auto px-2 py-1 bg-gray-100 rounded text-sm">Clear</button>
      </div>
    )
  }

  // Service mode: complex form with select and optional inputs
  const needsValue = selectedAction === 'category' || selectedAction === 'price-update'
  const canExecute = Boolean(
    selectedAction && selectedIds.length > 0 && (!needsValue || (selectedAction === 'category' && categoryValue) || (selectedAction === 'price-update' && priceValue && !isNaN(parseFloat(priceValue))))
  )

  const handleBulkAction = async () => {
    if (!selectedAction || selectedIds.length === 0 || !onBulkAction) return
    let actionValue: string | number | undefined
    if (selectedAction === 'category') actionValue = categoryValue
    else if (selectedAction === 'price-update') actionValue = parseFloat(priceValue)

    const validation = validateBulkAction(selectedAction, selectedIds as string[], actionValue)
    if (!validation.isValid) { alert(`Invalid action: ${validation.errors.join(', ')}`); return }

    try {
      setIsProcessing(true)
      const actionKey = selectedAction as ServiceBulkActionType
      await onBulkAction({ action: actionKey, serviceIds: selectedIds as string[], value: actionValue })
      setSelectedAction('')
      setCategoryValue('')
      setPriceValue('')
    } finally { setIsProcessing(false) }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">{selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected</span>
            <span className="sr-only">selected</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} className="text-blue-700 hover:text-blue-900">Clear Selection</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>Bulk Action</Label>
            <select value={selectedAction} onChange={(e) => setSelectedAction((e.target as HTMLSelectElement).value as ServiceBulkActionType | '')} className="w-full rounded border px-3 py-2 text-sm">
              <option value="">Choose action</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="feature">Add to Featured</option>
              <option value="unfeature">Remove from Featured</option>
              <option value="category">Update Category</option>
              <option value="price-update">Update Price</option>
              <option value="delete">Delete</option>
            </select>
          </div>

          {selectedAction === 'category' && (
            <div className="space-y-2">
              <Label>New Category</Label>
              <Input value={categoryValue} onChange={(e) => setCategoryValue((e.target as HTMLInputElement).value)} placeholder="Enter category name" list="bulk-categories" />
              <datalist id="bulk-categories">{categories.map((c) => (<option key={c} value={c} />))}</datalist>
            </div>
          )}

          {selectedAction === 'price-update' && (
            <div className="space-y-2">
              <Label>New Price (USD)</Label>
              <Input type="number" step="0.01" min="0" value={priceValue} onChange={(e) => setPriceValue((e.target as HTMLInputElement).value)} placeholder="0.00" />
            </div>
          )}

          {!needsValue && <div />}

          <Button onClick={handleBulkAction} disabled={!canExecute || isProcessing || loading} variant={selectedAction === 'delete' ? 'destructive' : 'default'} className="gap-2">
            {isProcessing ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>) : ('Apply Action')}
          </Button>
        </div>

        {selectedAction && (
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">
              <strong>Preview:</strong> This will {selectedAction.replace('-', ' ')} {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}.
              {selectedAction === 'delete' && (<span className="text-red-600 font-medium ml-1">This action cannot be undone.</span>)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
