'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export default function DependencyManager({
  value = [],
  available = [],
  onChange = (v: string[]) => {},
}: {
  value?: string[]
  available?: { id: string; title: string }[]
  onChange?: (v: string[]) => void
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-700 mb-1">Dependencies</div>
      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-auto">
        {available.length === 0 && <div className="text-xs text-gray-500">No other tasks available</div>}
        {available.map((t) => (
          <label key={t.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
            <input type="checkbox" checked={value.includes(t.id)} onChange={() => toggle(t.id)} />
            <div className="flex-1 text-sm">{t.title}</div>
            <Button size="sm" variant="ghost" onClick={() => toggle(t.id)}>{value.includes(t.id) ? 'Remove' : 'Add'}</Button>
          </label>
        ))}
      </div>
    </div>
  )
}
