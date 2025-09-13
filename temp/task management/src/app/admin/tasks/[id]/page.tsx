'use client'

import React from 'react'
import DevTaskManagement from '../../../../../dev-task-management'

interface PageProps {
  params: { id: string }
}

export default function TaskDetailPage({ params }: PageProps) {
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-gray-600">Task ID: {params.id}</div>
      <DevTaskManagement />
    </div>
  )
}
