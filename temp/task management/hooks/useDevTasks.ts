import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../task-types'
import { apiTasksToUi, uiCreateToApi, uiUpdateToApi, type ApiTask } from '../lib/tasks/adapters'

interface UseDevTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CreateTaskInput) => Promise<Task | null>
  update: (id: string, updates: UpdateTaskInput & { status?: Task['status'] }) => Promise<Task | null>
  remove: (id: string) => Promise<boolean>
}

export const useDevTasks = (limit: number = 20): UseDevTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/tasks?limit=${encodeURIComponent(limit)}`)
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`)
      const data: ApiTask[] | { tasks: ApiTask[] } = await res.json()
      const items = Array.isArray(data) ? data : (data as any).tasks
      const mapped = apiTasksToUi(items || [])
      setTasks(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [limit])

  const create = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    try {
      setError(null)
      const body = uiCreateToApi(input)
      const res = await fetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to create task')
      await refresh()
      return null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
      return null
    }
  }, [refresh])

  const update = useCallback(async (id: string, updates: UpdateTaskInput & { status?: Task['status'] }): Promise<Task | null> => {
    try {
      setError(null)
      const body = uiUpdateToApi(updates)
      const res = await fetch(`/api/admin/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to update task')
      await refresh()
      return null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update task')
      return null
    }
  }, [refresh])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      const res = await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      await refresh()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task')
      return false
    }
  }, [refresh])

  useEffect(() => { refresh() }, [refresh])

  return { tasks, loading, error, refresh, create, update, remove }
}
