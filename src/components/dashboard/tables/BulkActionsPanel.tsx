"use client"

import { ReactNode } from "react"

interface BulkAction<T = any> {
  key: string
  label: string
  onClick: (selectedIds: Array<string | number>) => void
  icon?: ReactNode
  variant?: "default" | "destructive"
}

export default function BulkActionsPanel({
  selectedIds,
  actions,
  onClear,
}: {
  selectedIds: Array<string | number>
  actions: BulkAction[]
  onClear: () => void
}) {
  if (selectedIds.length === 0) return null

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">{selectedIds.length} selected</div>
      <div className="flex items-center gap-2">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => a.onClick(selectedIds)}
            className={`px-3 py-1.5 text-sm rounded border ${a.variant === 'destructive' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
        <button onClick={onClear} className="px-3 py-1.5 text-sm rounded text-white bg-green-600 hover:bg-green-700">Clear</button>
      </div>
    </div>
  )
}
