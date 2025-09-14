import React from 'react'
import { getProgressColor } from '@/lib/tasks/utils'

interface TaskProgressProps { percentage: number; size?: 'sm' | 'md' | 'lg'; showLabel?: boolean }

export const TaskProgress: React.FC<TaskProgressProps> = ({ percentage, size = 'md', showLabel = true }) => {
  const sizeClasses = { sm: 'h-1', md: 'h-2', lg: 'h-3' }
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${getProgressColor(percentage)}`} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
    </div>
  )
}
