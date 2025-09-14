import React from 'react'

export const TaskAssignee: React.FC<{ name?: string }> = ({ name }) => {
  return (
    <div className="text-sm text-gray-700">{name ?? 'Unassigned'}</div>
  )
}
