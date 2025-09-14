import React, { useState, useMemo } from 'react'
import { 
  Plus,
  Target,
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Task, TaskStatus } from './types'
import { TaskCard, TaskCardSkeleton } from './cards'
import { groupTasksByStatus } from './utils'

// TaskListView Component
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

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  loading = false,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onTaskView,
  onTaskSelect,
  selectedTasks = [],
  gridCols = 3
}) => {
  const gridClasses = {
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
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or create a new task to get started.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid ${gridClasses[gridCols]} gap-6`}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={selectedTasks.includes(task.id)}
          onEdit={onTaskEdit}
          onDelete={onTaskDelete}
          onStatusChange={onTaskStatusChange}
          onView={onTaskView}
          onSelect={onTaskSelect}
        />
      ))}
    </div>
  )
}

// TaskBoardView Component - Kanban Style
interface TaskBoardViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
  onTaskView?: (task: Task) => void
}

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  loading = false,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onTaskView
}) => {
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
                <span className="text-xs bg-white px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onStatusChange={onTaskStatusChange}
                  onView={onTaskView}
                  className="cursor-move"
                />
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

// TaskCalendarView Component
interface TaskCalendarViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskView?: (task: Task) => void
  currentDate?: Date
  onDateChange?: (date: Date) => void
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  loading = false,
  onTaskEdit,
  onTaskView,
  currentDate = new Date(),
  onDateChange
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach(task => {
      const dateKey = new Date(task.dueDate).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(task)
    })
    return grouped
  }, [tasks])

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: Date[] = []
    const currentDay = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    onDateChange?.(newDate)
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                className="text-xs capitalize"
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {getCalendarDays().map((date, idx) => {
            const dateKey = date.toDateString()
            const dayTasks = tasksByDate[dateKey] || []
            const isCurrentMonthDay = isCurrentMonth(date)
            const isTodayDate = isToday(date)
            
            return (
              <div
                key={idx}
                className={`
                  min-h-[120px] border rounded-lg p-2 
                  ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                  ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                  hover:bg-gray-50 cursor-pointer
                `}
              >
                <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                      onClick={() => onTaskView?.(task)}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// TaskTableView Component
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

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  loading = false,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onTaskSelect,
  selectedTasks = [],
  onSort,
  sortField,
  sortDirection = 'asc'
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="animate-pulse">
            <div className="border-b bg-gray-50 p-4">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b p-4">
                <div className="grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded" />
                  ))}
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
                        <div className="text-xs text-gray-600 truncate max-w-xs">
                          {task.description}
                        </div>
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
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                      <div className="text-xs text-red-600 font-medium">Overdue</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTaskEdit?.(task)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {}}
                        className="text-xs"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
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
}>