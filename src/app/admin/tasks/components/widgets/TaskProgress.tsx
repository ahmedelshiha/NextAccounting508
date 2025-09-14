import React from 'react'

export const TaskProgress: React.FC<{ percentage: number; size?: 'sm'|'md'|'lg'; showLabel?: boolean }> = ({ percentage, size='md', showLabel=true }) => {
  const h = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3'
  return (
    <div>
      <div className={`w-full bg-gray-200 rounded ${h}`}>
        <div className={`bg-blue-600 h-full rounded`} style={{ width: Math.max(0, Math.min(100, percentage)) + '%' }} />
      </div>
      {showLabel && <div className="text-xs text-gray-600 mt-1">{percentage}%</div>}
    </div>
  )
}
