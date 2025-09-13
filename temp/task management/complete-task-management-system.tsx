import React, { useState, useMemo, useCallback } from 'react'
import { 
  Plus,
  Filter,
  Download,
  Upload,
  Settings,
  X,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Users,
  Edit,
  Trash2,
  Eye,
  Flag,
  Target,
  Timer,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Building,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  List,
  MoreVertical,
  ChevronLeft
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Types
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
type TaskCategory = 'booking' | 'client' | 'system' | 'finance' | 'compliance' | 'marketing'
type ViewMode = 'list' | 'board' | 'calendar' | 'table'
type SortOption = 'dueDate' | 'priority' | 'status' | 'assignee' | 'category'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface Client {
  id: string
  name: string
  company?: string
  email: string
}

interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  category: TaskCategory
  dueDate: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  completionPercentage: number
  assignee?: User
  assigneeId?: string
  clientId?: string
  client?: Client
  bookingId?: string
  revenueImpact?: number
  complianceRequired: boolean
  tags: string[]
  dependencies: string[]
  collaborators: User[]
  createdBy: User
  progress: any[]
  customFields: Record<string, any>
  attachments: any[]
  comments: any[]
  reminders: any[]
  watchers: string[]
}

interface TaskStatistics {
  total: number
  overdue: number
  dueToday: number
  dueSoon: number
  completed: number
  inProgress: number
  blocked: number
  byPriority: Record<TaskPriority, number>
  byCategory: Record<TaskCategory, number>
  byAssignee: Record<string, number>
  productivity: number
  averageCompletionTime: number
  complianceRate: number
}

interface TaskFilters {
  search: string
  status: TaskStatus[]
  priority: TaskPriority[]
  category: TaskCategory[]
  assignee: string[]
  client: string[]
  dateRange: {
    start?: string
    end?: string
  }
  overdue: boolean
  compliance: boolean
  tags: string[]
}

// Mock data
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

// Utility functions
const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200'
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low': return 'text-green-600 bg-green-50 border-green-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-50'
    case 'in_progress': return 'text-blue-600 bg-blue-50'
    case 'review': return 'text-purple-600 bg-purple-50'
    case 'blocked': return 'text-red-600 bg-red-50'
    case 'pending': return 'text-gray-600 bg-gray-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

const getCategoryIcon = (category: TaskCategory) => {
  switch (category) {
    case 'finance': return DollarSign
    case 'compliance': return AlertTriangle
    case 'client': return User
    case 'system': return Settings
    case 'marketing': return TrendingUp
    case 'booking': return Calendar
    default: return FileText
  }
}

const isOverdue = (dueDate: string, status: TaskStatus): boolean => {
  return new Date(dueDate) < new Date() && status !== 'completed'
}

const getProgressColor = (percentage: number): string => {
  if (percentage === 100) return 'bg-green-500'
  if (percentage > 75) return 'bg-blue-500'
  if (percentage > 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Task Card Component
interface TaskCardProps {
  task: Task
  isSelected?: boolean
  onSelect?: (taskId: string) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  onView?: (task: Task) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onView
}) => {
  const CategoryIcon = getCategoryIcon(task.category)
  const overdue = isOverdue(task.dueDate, task.status)
  
  return (
    <Card 
      className={`
        transition-all hover:shadow-md cursor-pointer
        ${overdue ? 'border-red-200 bg-red-50' : 'hover:border-gray-300'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={() => onSelect?.(task.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)} border`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium line-clamp-1">{task.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {overdue && <AlertCircle className="h-4 w-4 text-red-500" />}
            {task.complianceRequired && <Flag className="h-4 w-4 text-orange-500" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{task.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.completionPercentage)}`}
                style={{ width: `${task.completionPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Task details */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={overdue ? 'text-red-600 font-medium' : ''}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.estimatedHours}h est.</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignee?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span className="capitalize">{task.category}</span>
            </div>
          </div>
          
          {/* Revenue impact */}
          {task.revenueImpact && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded p-2">
              <DollarSign className="h-3 w-3" />
              <span>Revenue Impact: ${task.revenueImpact}</span>
            </div>
          )}
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
          <div className="flex gap-1">
            {task.status !== 'completed' && onStatusChange && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  const newStatus = task.status === 'in_progress' ? 'completed' : 'in_progress'
                  onStatusChange(task.id, newStatus)
                }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {task.status === 'in_progress' ? 'Complete' : 'Start'}
              </Button>
            )}
          </div>
          
          <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => {
            e.stopPropagation()
            onView?.(task)
          }}>
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Task Management System Component
const TaskManagementSystem: React.FC = () => {
  const [tasks] = useState<Task[]>(mockTasks)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    category: [],
    assignee: [],
    client: [],
    dateRange: {},
    overdue: false,
    compliance: false,
    tags: []
  })

  // Calculate statistics
  const statistics = useMemo((): TaskStatistics => {
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

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [tasks, searchQuery])

  // Event handlers
  const handleNewTask = useCallback(() => {
    console.log('Create new task')
  }, [])

  const handleTaskEdit = useCallback((task: Task) => {
    setSelectedTask(task)
    console.log('Edit task:', task)
  }, [])

  const handleTaskView = useCallback((task: Task) => {
    setSelectedTask(task)
    console.log('View task:', task)
  }, [])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      console.log('Delete task:', taskId)
    }
  }, [])

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    console.log('Update task status:', taskId, status)
  }, [])

  const selectTask = useCallback((taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTasks([])
  }, [])

  // Statistics component
  const TaskStats = () => {
    const statItems = [
      { label: 'Total Tasks', value: statistics.total, icon: Target, color: 'text-gray-600' },
      { label: 'Overdue', value: statistics.overdue, icon: AlertCircle, color: 'text-red-600' },
      { label: 'Due Today', value: statistics.dueToday, icon: Calendar, color: 'text-orange-600' },
      { label: 'In Progress', value: statistics.inProgress, icon: Timer, color: 'text-blue-600' },
      { label: 'Completed', value: statistics.completed, icon: CheckCircle2, color: 'text-green-600' },
      { label: 'Productivity', value: `${statistics.productivity}%`, icon: BarChart3, color: 'text-purple-600' }
    ]

    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {statItems.map((stat, idx) => {
          const IconComponent = stat.icon
          return (
            <Card key={idx} className="text-center">
              <CardContent className="p-4">
                <IconComponent className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">
            {statistics.total} total tasks • {statistics.overdue} overdue • {statistics.completed} completed
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {selectedTasks.length > 0 && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          )}
          
          <Button size="sm" onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <TaskStats />

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tasks by title, description, assignee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { value: 'list', label: 'List' },
                { value: 'board', label: 'Board' },
                { value: 'calendar', label: 'Calendar' },
                { value: 'table', label: 'Table' }
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={viewMode === value ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-3"
                  onClick={() => setViewMode(value as ViewMode)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedTasks.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Mark Complete
                </Button>
                <Button variant="outline" size="sm">
                  Start Progress
                </Button>
                <Button variant="outline" size="sm">
                  Delete
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTasks.includes(task.id)}
            onSelect={selectTask}
            onEdit={handleTaskEdit}
            onDelete={handleTaskDelete}
            onStatusChange={handleTaskStatusChange}
            onView={handleTaskView}
          />
        ))}
      </div>
      
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or create a new task.</p>
            <Button onClick={handleNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </CardContent>
        </Card>
      )}
    