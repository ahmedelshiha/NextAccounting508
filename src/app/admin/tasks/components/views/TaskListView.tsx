'use client'

import React from 'react'
import { Target, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Task, TaskStatus } from '@/lib/tasks/types'
import { TaskCard, TaskCardSkeleton } from '../cards'

interface TaskListViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
  onTaskView?: (task: Task) => void
  onTaskSelect?: (taskId: string) => void
  selectedTasks?: string[]
  gridCols?: 1 | 2 | 3 | 4
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, loading = false, onTaskEdit, onTaskDelete, onTaskStatusChange, onTaskView, onTaskSelect, selectedTasks = [], gridCols = 3 }) => {
  const gridClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  if (loading) {
    return (
      <div className={`grid ${gridClasses[gridCols]} gap-6`}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <TaskCardSkeleton key={idx} />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or create a new task to get started.</p>
          <a href="/admin/tasks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid ${gridClasses[gridCols]} gap-6`}>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} isSelected={selectedTasks.includes(task.id)} onEdit={onTaskEdit} onDelete={onTaskDelete} onStatusChange={onTaskStatusChange} onView={onTaskView} onSelect={onTaskSelect} />
      ))}
    </div>
  )
}
