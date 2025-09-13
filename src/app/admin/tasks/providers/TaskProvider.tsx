import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { Task, CreateTaskInput } from '../task-types'

const TaskContext = createContext<any>(null)

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/tasks')
      if (res.ok) {
        const data = await res.json().catch(() => [])
        setTasks(data || [])
      } else {
        setError('Failed to load tasks')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const createTask = async (input: CreateTaskInput) => {
    const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (res.ok) { await refresh(); return (await res.json()) }
    throw new Error('Create failed')
  }

  const updateTask = async (id: string, updates: any) => {
    const res = await apiFetch(`/api/admin/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    if (res.ok) { await refresh(); return (await res.json()) }
    throw new Error('Update failed')
  }

  const deleteTask = async (id: string) => {
    const res = await apiFetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) { await refresh(); return true }
    throw new Error('Delete failed')
  }

  const value = { tasks, loading, error, refresh, createTask, updateTask, deleteTask }
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export const useTaskContext = () => {
  return useContext(TaskContext)
}
