import { MoreVertical, List } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Task, TaskStatus } from '../../task-types'

interface TaskTableViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
  onTaskSelect?: (taskId: string) => void
  selectedTasks?: string[]
  onSort?: (field: string) => void
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({ tasks, loading = false, onTaskEdit, onTaskDelete, onTaskStatusChange, onTaskSelect, selectedTasks = [], onSort, sortField, sortDirection = 'asc' }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="animate-pulse">
            <div className="border-b bg-gray-50 p-4">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-4 bg-gray-200 rounded" />))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b p-4">
                <div className="grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, j) => (<div key={j} className="h-4 bg-gray-200 rounded" />))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Task</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Assignee</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Due Date</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-sm">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-600 truncate max-w-xs">{task.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">{task.assignee.name.charAt(0).toUpperCase()}</div>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</div>
                    {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                      <div className="text-xs text-red-600 font-medium">Overdue</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onTaskEdit?.(task)} className="text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => {}} className="text-xs"><MoreVertical className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && (
          <div className="p-12 text-center">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks to display</h3>
            <p className="text-gray-600">Adjust your filters or create a new task.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
