'use client'

import React from 'react'
import TaskManagementSystem from '../../../../../complete-task-management-system'

interface PageProps {
  params: { id: string }
}

export default function TaskDetailPage({ params }: PageProps) {
  // In dev workspace we reuse the main system; a real detail view would focus on the task by ID
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-gray-600">Task ID: {params.id}</div>
      <TaskManagementSystem />
    </div>
  )
}
