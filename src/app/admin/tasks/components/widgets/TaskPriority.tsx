import React from 'react'
import { Flag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TaskPriority as TaskPriorityType } from '@/lib/tasks/types'
import { getPriorityColor } from '@/lib/tasks/utils'

interface TaskPriorityProps { priority: TaskPriorityType; variant?: 'badge' | 'icon' | 'full'; size?: 'sm' | 'md' }

export const TaskPriority: React.FC<TaskPriorityProps> = ({ priority, variant = 'badge', size = 'md' }) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  if (variant === 'icon') return (<div className={`p-1 rounded ${getPriorityColor(priority)}`}><Flag className={iconSize} /></div>)
  if (variant === 'full') return (<div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}><Flag className="h-3 w-3" /><span className="capitalize">{priority}</span></div>)
  return (<Badge variant="outline" className={`text-xs capitalize ${getPriorityColor(priority)}`}>{priority}</Badge>)
}
