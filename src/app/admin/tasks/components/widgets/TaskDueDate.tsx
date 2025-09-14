import React from 'react'

export const TaskDueDate: React.FC<{ dueDate?: string }> = ({ dueDate }) => {
  if (!dueDate) return <div className="text-sm text-gray-500">No due date</div>
  return <div className="text-sm text-gray-700">{new Date(dueDate).toLocaleDateString()}</div>
}
