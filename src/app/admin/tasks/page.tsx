'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { TaskProvider, useTasks } from './providers/TaskProvider'
import { TasksToolbar } from './components/layout'
import { TaskListView } from './components/views/TaskListView'
import type { Task, TaskStatus } from './task-types'

function TasksContent() {
  const { tasks, loading, error, updateTask, deleteTask } = useTasks()
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const q = searchQuery.toLowerCase()
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase() || '').includes(q) ||
      (t.assignee?.name?.toLowerCase() || '').includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }, [tasks, searchQuery])

  const onTaskStatusChange = useCallback((id: string, status: TaskStatus) => {
    return updateTask(id, { status })
  }, [updateTask])

  const onTaskDelete = useCallback((id: string) => {
    return deleteTask(id)
  }, [deleteTask])

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>
      )}
      <TasksToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} showFilters={false} />
      <TaskListView tasks={filtered as Task[]} loading={loading} onTaskStatusChange={onTaskStatusChange} onTaskDelete={onTaskDelete} />
    </div>
  )
}

export default function AdminTasksPage() {
  return (
    <div className="p-6">
      <TaskProvider>
        <TasksContent />
      </TaskProvider>
    </div>
  )
}
