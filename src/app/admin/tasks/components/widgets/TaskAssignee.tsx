import React from 'react'
import { User } from 'lucide-react'
import type { Task } from '../../task-types'

interface TaskAssigneeProps { assignee?: Task['assignee']; variant?: 'avatar' | 'name' | 'full'; size?: 'sm' | 'md' }

export const TaskAssignee: React.FC<TaskAssigneeProps> = ({ assignee, variant = 'full', size = 'md' }) => {
  if (!assignee) return (<div className="flex items-center gap-1 text-gray-500 text-xs"><User className="h-3 w-3" /><span>Unassigned</span></div>)
  const avatarSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  if (variant === 'avatar') return (<div className={`${avatarSize} rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium`}>{assignee.name.charAt(0).toUpperCase()}</div>)
  if (variant === 'name') return (<span className="text-sm">{assignee.name}</span>)
  return (
    <div className="flex items-center gap-2">
      <div className={`${avatarSize} rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium`}>{assignee.name.charAt(0).toUpperCase()}</div>
      <span className="text-sm">{assignee.name}</span>
    </div>
  )
}
