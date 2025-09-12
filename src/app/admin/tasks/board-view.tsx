'use client'

import React from 'react'
import { TaskStatus } from '../admin/tasks/page'
import { Card } from '@/components/ui/card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BoardViewProps<T> {
  tasks: T[]
  onMove: (id: string, status: TaskStatus) => void
  renderCard: (task: T) => React.ReactNode
}

const columns: { key: TaskStatus; title: string }[] = [
  { key: 'pending', title: 'Pending' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'review', title: 'Review' },
  { key: 'completed', title: 'Completed' },
  { key: 'blocked', title: 'Blocked' },
]

export default function BoardView<T extends { id: string; status: TaskStatus }>({ tasks, onMove, renderCard }: BoardViewProps<T>) {
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/task-id')
    if (id) onMove(id, status)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t: any) => t.status === col.key)
        return (
          <div key={col.key} className="bg-background border rounded p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.key)}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <Badge variant="outline" className="text-xs">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {colTasks.map((t: any) => (
                <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/task-id', t.id)}>
                  {renderCard(t)}
                </div>
              ))}
              {colTasks.length === 0 && <div className="text-xs text-gray-500">No tasks</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
