'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import type { Task, TaskPriority, TaskStatus } from '@/lib/tasks/types'

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

// Map backend enums to UI enums
const mapPriorityFromDb = (p: string): TaskPriority => {
  const v = String(p || '').toUpperCase()
  if (v === 'LOW') return 'low'
  if (v === 'MEDIUM') return 'medium'
  if (v === 'HIGH') return 'high'
  return 'medium'
}
const mapStatusFromDb = (s: string): TaskStatus => {
  const v = String(s || '').toUpperCase()
  if (v === 'OPEN') return 'pending'
  if (v === 'IN_PROGRESS') return 'in_progress'
  if (v === 'DONE') return 'completed'
  return 'pending'
}
const mapStatusToDb = (s: TaskStatus): string => {
  if (s === 'in_progress') return 'IN_PROGRESS'
  if (s === 'completed') return 'DONE'
  return 'OPEN'
}
const mapPriorityToDb = (p: TaskPriority): string => {
  if (p === 'low') return 'LOW'
  if (p === 'high') return 'HIGH'
  return 'MEDIUM'
}

// Normalize DB task to UI Task shape to avoid runtime crashes
const toUiTask = (row: any): Task => {
  const assignee = row.assignee ? { id: row.assignee.id, name: row.assignee.name || row.assignee.email || 'User', email: row.assignee.email || '', role: 'STAFF' } : undefined
  return {
    id: row.id,
    title: row.title || 'Untitled',
    description: row.description || '',
    priority: mapPriorityFromDb(row.priority),
    status: mapStatusFromDb(row.status),
    category: 'system',
    dueDate: row.dueAt ? new Date(row.dueAt).toISOString() : new Date(row.createdAt || Date.now()).toISOString(),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    completedAt: undefined,
    estimatedHours: 0,
    actualHours: undefined,
    assignee,
    assigneeId: row.assigneeId || assignee?.id || undefined,
    collaborators: [],
    createdBy: { id: 'system', name: 'System', email: 'system@local', role: 'system' },
    completionPercentage: mapStatusFromDb(row.status) === 'completed' ? 100 : 0,
    progress: [],
    dependencies: [],
    blockedBy: [],
    clientId: undefined,
    client: undefined,
    bookingId: undefined,
    booking: undefined,
    revenueImpact: undefined,
    complianceRequired: false,
    complianceDeadline: undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    customFields: {},
    attachments: [],
    comments: [],
    workflow: undefined,
    template: undefined,
    recurring: undefined,
    reminders: [],
    watchers: [],
  }
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/tasks?limit=200')
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`)
      const data = await res.json()
      const normalized = Array.isArray(data) ? data.map(toUiTask) : []
      setTasks(normalized)
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
            setTasks(prev => [toUiTask(d.payload), ...prev.filter(t => t.id !== d.payload.id)])
          } else if (d.type === 'task.updated') {
            setTasks(prev => prev.map(t => t.id === d.payload.id ? toUiTask(d.payload) : t))
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
    const nowIso = new Date().toISOString()
    const tempTask: Task = {
      id: tempId,
      title: input.title || 'Untitled',
      description: input.description || '',
      priority: (input.priority as TaskPriority) || 'medium',
      status: 'pending',
      category: 'system',
      dueDate: input.dueDate || nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: undefined,
      estimatedHours: 0,
      actualHours: undefined,
      assignee: undefined,
      assigneeId: undefined,
      collaborators: [],
      createdBy: { id: 'system', name: 'System', email: 'system@local', role: 'system' },
      completionPercentage: 0,
      progress: [],
      dependencies: [],
      blockedBy: [],
      clientId: undefined,
      client: undefined,
      bookingId: undefined,
      booking: undefined,
      revenueImpact: undefined,
      complianceRequired: false,
      complianceDeadline: undefined,
      tags: [],
      customFields: {},
      attachments: [],
      comments: [],
      workflow: undefined,
      template: undefined,
      recurring: undefined,
      reminders: [],
      watchers: [],
    }
    setTasks(prev => [tempTask, ...prev])
    try {
      // Send minimal fields to backend, mapping enums
      const payload = {
        title: tempTask.title,
        priority: mapPriorityToDb(tempTask.priority),
        status: mapStatusToDb(tempTask.status),
        dueAt: tempTask.dueDate,
        assigneeId: input && typeof input.assigneeId !== 'undefined' ? (input.assigneeId || null) : null,
      }
      const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to create')
      const created = toUiTask(await res.json())
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
      // Map UI enums to DB enums for PATCH
      const body: any = { ...updates }
      if (updates.status) body.status = mapStatusToDb(updates.status)
      if (updates.priority) body.priority = mapPriorityToDb(updates.priority)
      if (updates.dueDate) { body.dueAt = updates.dueDate; delete body.dueDate }

      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to update')
      const updated = toUiTask(await res.json())
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
