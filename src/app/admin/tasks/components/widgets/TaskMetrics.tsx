import React from 'react'
import type { Task } from '../../task-types'

export const TaskMetrics: React.FC<{ task: Task; showRevenue?: boolean; showTime?: boolean; showCompliance?: boolean }> = ({ task, showRevenue=false, showTime=true, showCompliance=false }) => {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      {showRevenue && <div>Revenue: ${task.revenueImpact ?? '—'}</div>}
      {showTime && <div>Estimated: {task.estimatedHours}h</div>}
      {showCompliance && <div>Compliance: {task.complianceRequired ? 'Yes' : 'No'}</div>}
    </div>
  )
}
