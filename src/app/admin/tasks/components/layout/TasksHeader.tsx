import React from 'react'
import { Plus, Settings, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TasksHeaderProps {
  totalTasks: number
  overdueTasks: number
  completedTasks: number
  onNewTask?: () => void
  onBulkActions?: () => void
  onExport?: () => void
  onImport?: () => void
  showBack?: boolean
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({ totalTasks, overdueTasks, completedTasks, onNewTask, onBulkActions, onExport, onImport }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
        <p className="text-gray-600 mt-1">{totalTasks} total tasks • {overdueTasks} overdue • {completedTasks} completed</p>
      </div>
      <div className="flex items-center gap-3">
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        {onBulkActions && (
          <Button variant="outline" size="sm" onClick={onBulkActions}>
            <Settings className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        )}
        {onNewTask && (
          <Button size="sm" onClick={onNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>
    </div>
  )
}
