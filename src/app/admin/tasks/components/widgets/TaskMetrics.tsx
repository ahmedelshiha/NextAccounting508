import React from 'react'
import { Clock, User, Target, DollarSign, AlertTriangle } from 'lucide-react'
import type { Task } from '@/lib/tasks/types'
import { TaskDueDate } from './TaskDueDate'

interface TaskMetricsProps { task: Task; showRevenue?: boolean; showTime?: boolean; showCompliance?: boolean }

export const TaskMetrics: React.FC<TaskMetricsProps> = ({ task, showRevenue = true, showTime = true, showCompliance = true }) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
      {showTime && (<div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{task.estimatedHours}h est.</span></div>)}
      <TaskDueDate dueDate={task.dueDate} status={task.status} variant="compact" />
      <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{task.assignee?.name || 'Unassigned'}</span></div>
      <div className="flex items-center gap-1"><Target className="h-3 w-3" /><span className="capitalize">{task.category}</span></div>
      {showRevenue && task.revenueImpact && (<div className="col-span-2 flex items-center gap-1 text-green-600 bg-green-50 rounded p-2"><DollarSign className="h-3 w-3" /><span>Revenue Impact: ${task.revenueImpact}</span></div>)}
      {showCompliance && task.complianceRequired && (<div className="col-span-2 flex items-center gap-1 text-orange-600 bg-orange-50 rounded p-2"><AlertTriangle className="h-3 w-3" /><span>Compliance Required</span></div>)}
    </div>
  )
}
