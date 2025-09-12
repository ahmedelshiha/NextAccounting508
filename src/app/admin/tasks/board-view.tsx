'use client'

import React from 'react'

// local TaskStatus type
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'

import { Card } from '@/components/ui/card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BoardViewProps<T> {
  tasks: T[]
  onMove: (id: string, status: TaskStatus) => void
  onReorder?: (id: string, status: TaskStatus, index: number) => void
  renderCard: (task: T) => React.ReactNode
}

const columns: { key: TaskStatus; title: string }[] = [
  { key: 'pending', title: 'Pending' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'review', title: 'Review' },
  { key: 'completed', title: 'Completed' },
  { key: 'blocked', title: 'Blocked' },
]

export default function BoardView<T extends { id: string; status: TaskStatus }>({ tasks, onMove, onReorder, renderCard }: BoardViewProps<T>) {
  const handleDropColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/task-id')
    if (id) onMove(id, status)
  }

  const handleDropAtIndex = (e: React.DragEvent, status: TaskStatus, index: number) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/task-id')
    if (!id) return
    if (onReorder) onReorder(id, status, index)
    else onMove(id, status)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t: any) => t.status === col.key)
        return (
          <div key={col.key} className="bg-background border rounded p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropColumn(e, col.key)}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <Badge variant="outline" className="text-xs">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {colTasks.map((t: any, idx: number) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/task-id', t.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropAtIndex(e, col.key, idx)}
                >
                  {renderCard(t)}
                </div>
              ))}
              {/* Drop at end of column */}
              <div
                className="h-8 rounded border border-dashed border-transparent hover:border-gray-300"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropAtIndex(e, col.key, colTasks.length)}
              />
              {colTasks.length === 0 && <div className="text-xs text-gray-500">No tasks</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
