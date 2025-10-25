'use client'

import React, { useState } from 'react'
import { useTranslationPriority } from '../hooks/useTranslationPriority'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash } from 'lucide-react'
import { SetPriorityModal } from './SetPriorityModal'

export const TranslationPriorityPanel: React.FC = () => {
  const { priorities, loading, error, remove, refresh } = useTranslationPriority()
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Translation Priorities</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Set Priority
          </button>
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading priorities...</div>}
      {error && <div className="text-red-600">Failed to load priorities</div>}

      {!loading && priorities.length === 0 && (
        <div className="text-sm text-gray-600">No priorities set yet</div>
      )}

      <div className="space-y-3">
        {priorities.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{p.key}</div>
                {p.languageCode && <div className="text-xs text-gray-500">{p.languageCode}</div>}
                <Badge variant="outline">{p.priority}</Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">Status: {p.status} • Updated {new Date(p.updatedAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditItem(p); setShowModal(true) }}
                className="px-3 py-1 text-sm rounded border text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={async () => { await remove(p.id); refresh() }}
                className="px-3 py-1 text-sm rounded border text-red-600 bg-white hover:bg-red-50 flex items-center gap-2"
              >
                <Trash className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <SetPriorityModal item={editItem} onClose={() => { setShowModal(false); refresh() }} />
      )}
    </div>
  )
}
