import React from 'react'
import DevTaskManagement from './dev-task-management'

export default function DevTasksApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Task Management — Development Mode</div>
          <a href="/admin" className="text-xs text-blue-600 hover:underline">Back to Admin</a>
        </div>
      </div>
      <DevTaskManagement />
    </div>
  )
}
