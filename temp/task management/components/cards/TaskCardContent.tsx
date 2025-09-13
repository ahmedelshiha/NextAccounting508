import React from 'react'
import type { Task } from '../../task-types'
import { TaskProgress, TaskMetrics, TaskTags } from '../widgets'

interface TaskCardContentProps { task: Task; showFullDetails?: boolean }

export const TaskCardContent: React.FC<TaskCardContentProps> = ({ task, showFullDetails = false }) => {
  return (
    <div className="space-y-3">
      {task.description && (
        <p className={`text-sm text-gray-600 ${showFullDetails ? '' : 'line-clamp-2'}`}>{task.description}</p>
      )}
      <TaskProgress percentage={task.completionPercentage} size="md" showLabel={true} />
      <TaskMetrics task={task} showRevenue={!!task.revenueImpact} showTime={true} showCompliance={task.complianceRequired} />
      <TaskTags tags={task.tags} maxVisible={showFullDetails ? 10 : 3} />
    </div>
  )
}
