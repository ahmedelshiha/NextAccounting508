import React from 'react'

export const TaskCategory: React.FC<{ category?: string }> = ({ category }) => {
  return <div className="text-sm text-gray-600">{category ?? 'General'}</div>
}
