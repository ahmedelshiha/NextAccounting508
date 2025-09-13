import React from 'react'
import { Search, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

export const TasksToolbar: React.FC<TasksToolbarProps> = ({ searchQuery, onSearchChange, onFiltersToggle, filtersActive = 0, viewMode = 'list', onViewModeChange, sortBy = 'dueDate', onSortChange, showFilters = true }) => {
  const viewOptions = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'table', label: 'Table' }
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
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input type="text" placeholder="Search tasks by title, description, assignee..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
            </div>
            {showFilters && onFiltersToggle && (
              <Button variant="outline" onClick={onFiltersToggle} className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {filtersActive > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{filtersActive}</span>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onSortChange && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white">
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            {onViewModeChange && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {viewOptions.map(({ value, label }) => (
                  <Button key={value} variant={viewMode === value ? 'default' : 'ghost'} size="sm" className="text-xs px-3" onClick={() => onViewModeChange(value as any)} title={label}>
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        {filtersActive > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Active filters: {filtersActive}</span>
              <Button variant="ghost" size="sm" className="text-xs">Clear all</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
