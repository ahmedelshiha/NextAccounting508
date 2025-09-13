'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import type { Task } from '../task-types'

type TaskEvent = { type: string, payload?: any }

interface TaskContextValue {
  tasks: Task[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createTask: (input: any) => Promise<Task | null>
  updateTask: (id: string, updates: any) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tasks?limit=200')
      if (!res.ok) throw new Error('Failed to load tasks')
      const data = await res.json()
      setTasks(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchTasks()
    // connect SSE
    try {
      const es = new EventSource('/api/admin/tasks/stream')
      esRef.current = es
      es.onmessage = (ev) => {
        try {
          const d: TaskEvent = JSON.parse(ev.data)
          if (!d) return
          if (d.type === 'task.created') {
            setTasks(prev => [d.payload, ...prev.filter(t => t.id !== d.payload.id)])
          } else if (d.type === 'task.updated') {
            setTasks(prev => prev.map(t => t.id === d.payload.id ? d.payload : t))
          } else if (d.type === 'task.deleted') {
            setTasks(prev => prev.filter(t => t.id !== d.payload.id))
          }
        } catch (e) { /* ignore malformed */ }
      }
      es.onerror = () => { /* swallow, will reconnect */ }
    } catch (e) { /* ignore ES issues */ }

    return () => {
      try { esRef.current?.close() } catch (e) {}
    }
  }, [fetchTasks])

  const createTask = useCallback(async (input: any) => {
    setError(null)
    const tempId = 'tmp_' + Date.now()
    const tempTask = { id: tempId, title: input.title || 'Untitled', status: 'PENDING', priority: input.priority || 'MEDIUM', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...input }
    setTasks(prev => [tempTask as Task, ...prev])
    try {
      const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      if (!res.ok) throw new Error('Failed to create')
      const created = await res.json()
      setTasks(prev => [created, ...prev.filter(t => t.id !== tempId)])
      return created
    } catch (e) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      setError(e instanceof Error ? e.message : 'Failed to create')
      return null
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: any) => {
    setError(null)
    let previous: Task | undefined
    setTasks(prev => prev.map(t => { if (t.id === id) { previous = t; return { ...t, ...updates, updatedAt: new Date().toISOString() } } return t }))
    try {
      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
      return updated
    } catch (e) {
      // rollback
      if (previous) setTasks(prev => prev.map(t => t.id === id ? previous as Task : t))
      setError(e instanceof Error ? e.message : 'Failed to update')
      return null
    }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setError(null)
    let removed: Task | undefined
    setTasks(prev => { const found = prev.find(t => t.id === id); removed = found; return prev.filter(t => t.id !== id) })
    try {
      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return true
    } catch (e) {
      if (removed) setTasks(prev => [removed as Task, ...prev])
      setError(e instanceof Error ? e.message : 'Failed to delete')
      return false
    }
  }, [])

  return (
    <TaskContext.Provider value={{ tasks, loading, error, refresh: fetchTasks, createTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
