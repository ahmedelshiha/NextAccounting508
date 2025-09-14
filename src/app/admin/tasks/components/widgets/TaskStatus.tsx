import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { TaskStatus as TaskStatusType } from '@/lib/tasks/types'
import { getStatusColor } from '@/lib/tasks/utils'

interface TaskStatusProps { status: TaskStatusType; variant?: 'badge' | 'dot' | 'full' }

export const TaskStatus: React.FC<TaskStatusProps> = ({ status, variant = 'badge' }) => {
  if (variant === 'dot') return (<div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${getStatusColor(status).replace('bg-', 'bg-').split(' ')[1]}`} /><span className="text-sm capitalize">{status.replace('_', ' ')}</span></div>)
  if (variant === 'full') return (<div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{status.replace('_', ' ')}</div>)
  return (<Badge variant="outline" className={`text-xs capitalize ${getStatusColor(status)}`}>{status.replace('_', ' ')}</Badge>)
}
