import React, { useMemo } from 'react'
import { Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Task, TaskStatus } from '../../task-types'
import { groupTasksByStatus } from '../../task-utils'
import { TaskCard } from '../cards'

interface TaskBoardViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
  onTaskView?: (task: Task) => void
}

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({ tasks, loading = false, onTaskEdit, onTaskDelete, onTaskStatusChange, onTaskView }) => {
  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks])

  const statusColumns: { key: TaskStatus; label: string; color: string }[] = [
    { key: 'pending', label: 'Pending', color: 'bg-gray-50 border-gray-200' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { key: 'review', label: 'Review', color: 'bg-purple-50 border-purple-200' },
    { key: 'blocked', label: 'Blocked', color: 'bg-red-50 border-red-200' },
    { key: 'completed', label: 'Completed', color: 'bg-green-50 border-green-200' }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusColumns.map(column => (
          <Card key={column.key} className={column.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{column.label}</CardTitle>
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statusColumns.map(column => {
        const columnTasks = groupedTasks[column.key] || []
        return (
          <Card key={column.key} className={`${column.color} min-h-[600px]`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{column.label}</CardTitle>
                <span className="text-xs bg-white px-2 py-1 rounded-full">{columnTasks.length}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnTasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={onTaskEdit} onDelete={onTaskDelete} onStatusChange={onTaskStatusChange} onView={onTaskView} className="cursor-move" />
              ))}
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No {column.label.toLowerCase()} tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
