import React from 'react'
import type { Task } from '@/lib/tasks/types'
import { TaskProgress, TaskMetrics, TaskTags } from '../widgets'

interface TaskCardContentProps { task: Task; showFullDetails?: boolean }

export const TaskCardContent: React.FC<TaskCardContentProps> = ({ task, showFullDetails = false }) => {
  return (
    <div className="space-y-3">
      {task.description && (
        <div className={`text-sm text-gray-600 overflow-hidden transition-[max-height] duration-200 ${showFullDetails ? '' : 'max-h-12 group-hover:max-h-96'}`}>
          <p className="whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
      <TaskProgress percentage={task.completionPercentage} size="md" showLabel={true} />
      <TaskMetrics task={task} showRevenue={!!task.revenueImpact} showTime={true} showCompliance={task.complianceRequired} />
      <TaskTags tags={task.tags} maxVisible={showFullDetails ? 10 : 5} />
    </div>
  )
}
