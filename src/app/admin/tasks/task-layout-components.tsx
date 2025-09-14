import React from 'react'
import { 
  Plus,
  Filter,
  Search,
  Target,
  AlertCircle,
  Calendar,
  Timer,
  CheckCircle2,
  BarChart3,
  Settings,
  Download,
  Upload
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TaskStatistics } from './types'

// TasksStats Component
interface TasksStatsProps {
  stats: TaskStatistics
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
}

export const TasksStats: React.FC<TasksStatsProps> = ({ 
  stats, 
  timeRange = 'week',
  onTimeRangeChange 
}) => {
  const statItems = [
    { 
      label: 'Total Tasks', 
      value: stats.total, 
      icon: Target, 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    { 
      label: 'Overdue', 
      value: stats.overdue, 
      icon: AlertCircle, 
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    { 
      label: 'Due Today', 
      value: stats.dueToday, 
      icon: Calendar, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      label: 'In Progress', 
      value: stats.inProgress, 
      icon: Timer, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      icon: CheckCircle2, 
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Productivity', 
      value: `${stats.productivity}%`, 
      icon: BarChart3, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      {onTimeRangeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Time Range:</span>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['today', 'week', 'month', 'quarter'].map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                className="text-xs capitalize"
                onClick={() => onTimeRangeChange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statItems.map((stat, idx) => {
          const IconComponent = stat.icon
          return (
            <Card key={idx} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Avg. Completion</div>
                <div className="text-lg font-semibold">{stats.averageCompletionTime} days</div>
              </div>
              <Timer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
                <div className="text-lg font-semibold">{stats.complianceRate}%</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Due Soon</div>
                <div className="text-lg font-semibold">{stats.dueSoon}</div>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// TasksHeader Component
interface TasksHeaderProps {
  totalTasks: number
  overdueTasks: number
  completedTasks: number
  onNewTask?: () => void
  onBulkActions?: () => void
  onExport?: () => void
  onImport?: () => void
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({
  totalTasks,
  overdueTasks,
  completedTasks,
  onNewTask,
  onBulkActions,
  onExport,
  onImport
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
        <p className="text-gray-600 mt-1">
          {totalTasks} total tasks • {overdueTasks} overdue • {completedTasks} completed
        </p>
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

// TasksToolbar Component
interface TasksToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onFiltersToggle?: () => void
  filtersActive?: number
  viewMode?: 'list' | 'board' | 'calendar' | 'table'
  onViewModeChange?: (mode: 'list' | 'board' | 'calendar' | 'table') => void
  sortBy?: string
  onSortChange?: (sort: string) => void
  showFilters?: boolean
}

export const TasksToolbar: React.FC<TasksToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onFiltersToggle,
  filtersActive = 0,
  viewMode = 'list',
  onViewModeChange,
  sortBy = 'dueDate',
  onSortChange,
  showFilters = true
}) => {
  const viewOptions = [
    { value: 'list', label: 'List', icon: 'List' },
    { value: 'board', label: 'Board', icon: 'Columns' },
    { value: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { value: 'table', label: 'Table', icon: 'Table' }
  ]

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'category', label: 'Category' },
    { value: 'created', label: 'Created' }
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side - Search and Filters */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks by title, description, assignee..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters Toggle */}
            {showFilters && onFiltersToggle && (
              <Button
                variant="outline"
                onClick={onFiltersToggle}
                className="relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {filtersActive > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {filtersActive}
                  </span>
                )}
              </Button>
            )}
          </div>
          
          {/* Right side - Sort and View Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            {onSortChange && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* View Mode Toggle */}
            {onViewModeChange && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {viewOptions.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={viewMode === value ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs px-3"
                    onClick={() => onViewModeChange(value as any)}
                    title={label}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {filtersActive > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Active filters: {filtersActive}</span>
              <Button variant="ghost" size="sm" className="text-xs">
                Clear all
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}