import React, { useState, useCallback } from 'react'
import { 
  X,
  Calendar,
  User,
  Flag,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter as FilterIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TaskFilters, 
  TaskPriority, 
  TaskStatus, 
  TaskCategory,
  User as UserType,
  Client,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_CATEGORIES
} from './types'

// StatusFilter Component
interface StatusFilterProps {
  selectedStatuses: TaskStatus[]
  onStatusChange: (statuses: TaskStatus[]) => void
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  onStatusChange
}) => {
  const handleStatusToggle = (status: TaskStatus) => {
    const updated = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    onStatusChange(updated)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        Status
      </Label>
      <div className="space-y-2">
        {TASK_STATUSES.map(status => (
          <div key={status.value} className="flex items-center space-x-2">
            <Checkbox
              id={`status-${status.value}`}
              checked={selectedStatuses.includes(status.value)}
              onCheckedChange={() => handleStatusToggle(status.value)}
            />
            <Label 
              htmlFor={`status-${status.value}`}
              className="text-sm flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-').split(' ')[1]}`} />
              {status.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

// PriorityFilter Component
interface PriorityFilterProps {
  selectedPriorities: TaskPriority[]
  onPriorityChange: (priorities: TaskPriority[]) => void
}

export const PriorityFilter: React.FC<PriorityFilterProps> = ({
  selectedPriorities,
  onPriorityChange
}) => {
  const handlePriorityToggle = (priority: TaskPriority) => {
    const updated = selectedPriorities.includes(priority)
      ? selectedPriorities.filter(p => p !== priority)
      : [...selectedPriorities, priority]
    onPriorityChange(updated)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Flag className="h-4 w-4" />
        Priority
      </Label>
      <div className="space-y-2">
        {TASK_PRIORITIES.map(priority => (
          <div key={priority.value} className="flex items-center space-x-2">
            <Checkbox
              id={`priority-${priority.value}`}
              checked={selectedPriorities.includes(priority.value)}
              onCheckedChange={() => handlePriorityToggle(priority.value)}
            />
            <Label 
              htmlFor={`priority-${priority.value}`}
              className="text-sm flex items-center gap-2"
            >
              <Flag className={`h-3 w-3 ${priority.color.split(' ')[0]}`} />
              {priority.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

// CategoryFilter Component
interface CategoryFilterProps {
  selectedCategories: TaskCategory[]
  onCategoryChange: (categories: TaskCategory[]) => void
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoryChange