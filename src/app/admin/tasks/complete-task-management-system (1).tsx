import React, { useState, useMemo, useCallback } from 'react'
import { 
  Plus,
  Filter,
  Download,
  Upload,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import all the components we've created
import { TasksHeader } from './layout/TasksHeader'
import { TasksToolbar } from './layout/TasksToolbar' 
import { TasksStats } from './layout/TasksStats'
import { TaskFilters } from './filters/TaskFilters'
import { TaskListView } from './views/TaskListView'
import { TaskBoardView } from './views/TaskBoardView'
import { TaskCalendarView } from './views/TaskCalendarView'
import { TaskTableView } from './views/TaskTableView'

// Import hooks
import { useTasks } from './hooks/useTasks'
import { useTaskFilters } from './hooks/useTaskFilters'
import { useTaskActions } from './hooks/useTaskActions'
import { useTaskSearch } from './hooks/useTaskSearch'
import { useTaskBulkActions } from './hooks/useTaskBulkActions'

// Import types
import { Task, TaskStatus, ViewMode, SortOption, User, Client } from './types'
import { sortTasks } from './utils'

// Mock data for demonstration
const mockUsers: User[] = [
  { id: '1', name: 'John Smith', email: 'john@example.com', role: 'Senior Accountant' },
  { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'Tax Specialist' },
  { id: '3', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Client Manager' },
  { id: '4', name: 'Mike Johnson', email: 'mike@example.com', role: 'IT Administrator' },
  { id: '5', name: 'Lisa Chen', email: 'lisa@example.com', role: 'Marketing Manager' }
]

const mockClients: Client[] = [
  { id: 'c1', name: 'ABC Corp', company: 'ABC Corporation', email: 'contact@abc.com' },
  { id: 'c2', name: 'TechStart Ltd', company: 'TechStart Limited', email: 'info@techstart.com' },
  { id: 'c3', name: 'Global Enterprises', company: 'Global Enterprises Inc', email: 'hello@global.com' }
]

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete Q4 Financial Analysis for ABC Corp',
    description: 'Comprehensive quarterly review including balance sheet analysis, cash flow statements, and profit/loss evaluation',
    priority: 'critical',
    status: 'in_progress',
    category: 'finance',
    dueDate: '2025-09-12',
    createdAt: '2025-09-08T10:00:00Z',
    updatedAt: '2025-09-10T14:30:00Z',
    estimatedHours: 8,
    actualHours: 5,
    completionPercentage: 65,
    assignee: mockUsers[0],
    assigneeId: '1',
    collaborators: [],
    createdBy: mockUsers[0],
    progress: [],
    dependencies: [],
    clientId: 'c1',
    client: mockClients[0],
    bookingId: 'b1',
    revenueImpact: 2500,
    complianceRequired: true,
    tags: ['quarterly', 'financial-analysis'],
    customFields: {},
    attachments: [],
    comments: [],
    reminders: [],
    watchers: []
  },
  {
    id: '2',
    title: 'Submit VAT Returns - Multiple Clients',
    description: 'Monthly VAT filing deadline for 15 clients including calculation verification and HMRC submission',
    priority: 'high',
    status: 'pending',
    category: 'compliance',
    dueDate: '2025-09-11',
    createdAt: '2025-09-05T09:00:00Z',
    updatedAt: '2025-09-10T08:00:00Z',
    estimatedHours: 4,
    completionPercentage: 0,
    assignee: mockUsers[1],
    assigneeId: '2',
    collaborators: [],
    createdBy: mockUsers[0],
    progress: [],
    dependencies: [],
    complianceRequired: true,
    tags: ['vat', 'compliance', 'deadline'],
    customFields: {},
    attachments: [],
    comments: [],
    reminders: [],
    watchers: []
  },
  {
    id: '3',
    title: 'Client Onboarding - TechStart Ltd',
    description: 'Complete onboarding process including document collection, KYC verification, and service setup',
    priority: 'medium',
    status: 'in_progress',
    category: 'client',
    dueDate: '2025-09-15',
    createdAt: '2025-09-09T11:00:00Z',
    updatedAt: '2025-09-10T16:00:00Z',
    estimatedHours: 3,
    actualHours: 1.5,
    completionPercentage: 40,
    assignee: mockUsers[2],
    assigneeId: '3',
    collaborators: [],
    createdBy: mockUsers[0],
    progress: [],
    dependencies: [],
    clientId: 'c2',
    client: mockClients[1],
    revenueImpact: 1200,
    complianceRequired: false,
    tags: ['onboarding', 'kyc'],
    customFields: {},
    attachments: [],
    comments: [],
    reminders: [],
    watchers: []
  },
  {
    id: '4',
    title: 'System Backup Verification',
    description: 'Verify integrity of daily backups and test restore procedures',
    priority: 'low',
    status: 'pending',
    category: 'system',
    dueDate: '2025-09-13',
    createdAt: '2025-09-10T08:00:00Z',
    updatedAt: '2025-09-10T08:00:00Z',
    estimatedHours: 2,
    completionPercentage: 0,
    assignee: mockUsers[3],
    assigneeId: '4',
    collaborators: [],
    createdBy: mockUsers[0],
    progress: [],
    dependencies: [],
    complianceRequired: false,
    tags: ['backup', 'maintenance'],
    customFields: {},
    attachments: [],
    comments: [],
    reminders: [],
    watchers: []
  },
  {
    id: '5',
    title: 'Marketing Campaign Analysis - Q3',
    description: 'Analyze Q3 marketing performance, ROI calculation, and recommendations for Q4',
    priority: 'medium',
    status: 'review',
    category: 'marketing',
    dueDate: '2025-09-18',
    createdAt: '2025-09-07T14:00:00Z',
    updatedAt: '2025-09-10T17:30:00Z',
    estimatedHours: 6,
    actualHours: 5.5,
    completionPercentage: 90,
    assignee: mockUsers[4],
    assigneeId: '5',
    collaborators: [],
    createdBy: mockUsers[0],
    progress: [],
    dependencies: [],
    complianceRequired: false,
    tags: ['marketing', 'analysis', 'roi'],
    customFields: {},
    attachments: [],
    comments: [],
    reminders: [],
    watchers: []
  }
]

// Main Task Management System Component
const TaskManagementSystem: React.FC = () => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Custom hooks - Note: Using mock data for demonstration
  // In a real implementation, these would connect to your API
  const [tasks] = useState<Task[]>(mockTasks)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  
  // Mock implementations of the hooks
  const mockUpdateTask = useCallback(async (id: string, updates: any) => {
    // This would normally call your API
    console.log('Update task:', id, updates)
    return null
  }, [])
  
  const mockDeleteTask = useCallback(async (id: string) => {
    // This would normally call your API
    console.log('Delete task:', id)
    return true
  }, [])
  
  const mockBulkUpdate = useCallback(async (ids: string[], updates: any) => {
    // This would normally call your API
    console.log('Bulk update:', ids, updates)
    return true
  }, [])
  
  const mockBulkDelete = useCallback(async (ids: string[]) => {
    // This would normally call your API
    console.log('Bulk delete:', ids)
    return true
  }, [])

  // Hook implementations
  const { filters, setFilters, updateFilter, resetFilters, filteredTasks, activeFilterCount } = useTaskFilters(tasks)
  const { searchQuery, setSearchQuery, searchResults } = useTaskSearch(filteredTasks)
  const { updateTaskStatus, markTaskComplete, assignTask, updateTaskProgress, duplicateTask } = useTaskActions({
    onTaskUpdate: mockUpdateTask,
    onTaskDelete: mockDeleteTask
  })
  const { 
    selectedTasks, 
    selectTask, 
    unselectTask, 
    selectAllTasks, 
    clearSelection,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkAssign,
    bulkDelete,
    isTaskSelected,
    selectedCount
  } = useTaskBulkActions({
    onBulkUpdate: mockBulkUpdate,
    onBulkDelete: mockBulkDelete
  })

  // Calculate statistics
  const statistics = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const stats = tasks.reduce((acc, task) => {
      const dueDate = new Date(task.dueDate)
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      
      acc.total++
      
      if (dueDateOnly < today && task.status !== 'completed') {
        acc.overdue++
      }
      
      if (dueDateOnly.getTime() === today.getTime()) {
        acc.dueToday++
      }
      
      if (dueDateOnly <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
        acc.dueSoon++
      }
      
      if (task.status === 'completed') {
        acc.completed++
      }
      
      if (task.status === 'in_progress') {
        acc.inProgress++
      }
      
      if (task.status === 'blocked') {
        acc.blocked++
      }
      
      // By priority
      acc.byPriority[task.priority]++
      
      // By category  
      acc.byCategory[task.category]++
      
      // By assignee
      if (task.assignee) {
        acc.byAssignee[task.assignee.name] = (acc.byAssignee[task.assignee.name] || 0) + 1
      }
      
      return acc
    }, { 
      total: 0, 
      overdue: 0, 
      dueToday: 0, 
      dueSoon: 0, 
      completed: 0, 
      inProgress: 0, 
      blocked: 0,
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byCategory: { booking: 0, client: 0, system: 0, finance: 0, compliance: 0, marketing: 0 },
      byAssignee: {} as Record<string, number>,
      productivity: 0,
      averageCompletionTime: 0,
      complianceRate: 100
    })
    
    stats.productivity = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    
    return stats
  }, [tasks])

  // Sort and filter tasks
  const processedTasks = useMemo(() => {
    return sortTasks(searchResults, sortBy, sortDirection === 'asc')
  }, [searchResults, sortBy, sortDirection])

  // Event handlers
  const handleNewTask = useCallback(() => {
    console.log('Create new task')
    // This would open a task creation modal
  }, [])

  const handleTaskEdit = useCallback((task: Task) => {
    setSelectedTask(task)
    console.log('Edit task:', task)
    // This would open a task edit modal
  }, [])

  const handleTaskView = useCallback((task: Task) => {
    setSelectedTask(task)
    console.log('View task:', task)
    // This would open a task details modal
  }, [])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await mockDeleteTask(taskId)
    }
  }, [mockDeleteTask])

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTaskStatus(taskId, status)
  }, [updateTaskStatus])

  const handleBulkActions = useCallback(() => {
    console.log('Open bulk actions')
    // This would open a bulk actions modal
  }, [])

  const handleExport = useCallback(() => {
    console.log('Export tasks')
    // This would trigger task export
  }, [])

  const handleImport = useCallback(() => {
    console.log('Import tasks')
    // This would open import modal
  }, [])

  const handleSortChange = useCallback((newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy as SortOption)
      setSortDirection('asc')
    }
  }, [sortBy])

  // Render view based on selected mode
  const renderTaskView = () => {
    const viewProps = {
      tasks: processedTasks,
      loading,
      onTaskEdit: handleTaskEdit,
      onTaskDelete: handleTaskDelete,
      onTaskStatusChange: handleTaskStatusChange,
      onTaskView: handleTaskView,
      onTaskSelect: selectTask,
      selectedTasks
    }

    switch (viewMode) {
      case 'board':
        return <TaskBoardView {...viewProps} />
      case 'calendar':
        return <TaskCalendarView {...viewProps} />
      case 'table':
        return <TaskTableView {...viewProps} />
      default:
        return <TaskListView {...viewProps} />
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <TasksHeader
        totalTasks={statistics.total}
        overdueTasks={statistics.overdue}
        completedTasks={statistics.completed}
        onNewTask={handleNewTask}
        onBulkActions={selectedCount > 0 ? handleBulkActions : undefined}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Statistics */}
      <TasksStats stats={statistics} />

      {/* Toolbar */}
      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersToggle={() => setShowFilters(!showFilters)}
        filtersActive={activeFilterCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        showFilters={true}
      />

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <TaskFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableUsers={mockUsers}
              availableClients={mockClients}
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {selectedCount > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCount} task{selectedCount > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkUpdateStatus('completed')}
                    >
                      Mark Complete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkUpdateStatus('in_progress')}
                    >
                      Start Progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkDelete()}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {renderTaskView()}
        </div>
      </div>
    </div>
  )
}

export default TaskManagementSystem