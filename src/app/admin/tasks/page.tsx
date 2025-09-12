'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import TaskManagementSystem, { Task } from './TaskManagementSystem'
import { Button } from '@/components/ui/button'

interface TaskItem {
  id: string
  title: string
  dueAt: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | string
  assigneeId?: string | null
  createdAt?: string
  updatedAt?: string
}

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'DONE'

type SortBy = 'createdAt' | 'dueAt' | 'priority' | 'status' | 'title'

type CreateForm = { title: string; dueAt: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; notes: string }

type UpdatePayload = Partial<Pick<TaskItem, 'title' | 'dueAt' | 'priority' | 'status'>>

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskItem['priority']>('ALL')
  const [sortBy, setSortBy] = useState<SortBy>('dueAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({ title: '', dueAt: '', priority: 'MEDIUM', notes: '' })
  const [creating, setCreating] = useState(false)

  const loadTasks = useCallback(async () => {
    try {
      setErrorMsg(null)
      const res = await apiFetch('/api/admin/tasks?limit=50')
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const list = (await res.json()) as TaskItem[]
      const normalized = (Array.isArray(list) ? list : []).map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt ? String(t.dueAt) : null,
        priority: (t.priority as TaskItem['priority']) || 'MEDIUM',
        status: (t.status as TaskItem['status']) || 'OPEN',
        assigneeId: t.assigneeId ?? null,
        createdAt: t.createdAt ? String(t.createdAt) : undefined,
        updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
      }))
      setTasks(normalized)
    } catch (e) {
      console.error('loadTasks error', e)
      setErrorMsg('Unable to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const open = tasks.filter(t => t.status === 'OPEN').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const done = tasks.filter(t => t.status === 'DONE').length
    const now = new Date()
    const overdue = tasks.filter(t => t.dueAt && new Date(t.dueAt) < now && t.status !== 'DONE').length
    const dueToday = tasks.filter(t => {
      if (!t.dueAt) return false
      const d = new Date(t.dueAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    }).length
    const completion = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, open, inProgress, done, overdue, dueToday, completion }
  }, [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks
      .filter(t => statusFilter === 'ALL' ? true : t.status === statusFilter)
      .filter(t => priorityFilter === 'ALL' ? true : t.priority === priorityFilter)
      .filter(t => !q || t.title.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sortOrder === 'asc' ? 1 : -1
        const va = (() => {
          switch (sortBy) {
            case 'createdAt': return new Date(a.createdAt || 0).getTime()
            case 'dueAt': return new Date(a.dueAt || 0).getTime()
            case 'priority': return a.priority === b.priority ? 0 : a.priority < b.priority ? -1 : 1
            case 'status': return a.status === b.status ? 0 : a.status < b.status ? -1 : 1
            case 'title': return a.title.toLowerCase()
            default: return 0
          }
        })()
        const vb = (() => {
          switch (sortBy) {
            case 'createdAt': return new Date(b.createdAt || 0).getTime()
            case 'dueAt': return new Date(b.dueAt || 0).getTime()
            case 'priority': return a.priority === b.priority ? 0 : b.priority < a.priority ? -1 : 1
            case 'status': return a.status === b.status ? 0 : b.status < a.status ? -1 : 1
            case 'title': return b.title.toLowerCase()
            default: return 0
          }
        })()
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
        return (String(va)).localeCompare(String(vb)) * dir
      })
  }, [tasks, search, statusFilter, priorityFilter, sortBy, sortOrder])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try { await loadTasks() } finally { setRefreshing(false) }
  }, [loadTasks])

  const createTask = useCallback(async () => {
    if (!createForm.title.trim()) return
    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        title: createForm.title.trim(),
        dueAt: createForm.dueAt ? new Date(createForm.dueAt).toISOString() : null,
        priority: createForm.priority,
      }
      const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const msg = res.status === 501 ? 'Database not configured. Tasks are read-only in demo mode.' : 'Failed to create task'
        setErrorMsg(msg)
      } else {
        setCreateOpen(false)
        setCreateForm({ title: '', dueAt: '', priority: 'MEDIUM', notes: '' })
        await loadTasks()
      }
    } catch (e) {
      console.error('createTask error', e)
      setErrorMsg('Failed to create task')
    } finally {
      setCreating(false)
    }
  }, [createForm, loadTasks])

  const updateTask = useCallback(async (id: string, patch: UpdatePayload) => {
    const prev = tasks
    setTasks(cur => cur.map(t => (t.id === id ? { ...t, ...patch } : t)))
    try {
      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ...('title' in patch ? { title: patch.title } : {}),
        ...('status' in patch ? { status: patch.status } : {}),
        ...('priority' in patch ? { priority: patch.priority } : {}),
        ...('dueAt' in patch ? { dueAt: patch.dueAt } : {}),
      }) })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
    } catch (e) {
      console.error('updateTask error', e)
      setTasks(prev)
      setErrorMsg('Failed to update task')
    }
  }, [tasks])

  const priorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const mapApiToUi = (t: TaskItem) => ({
    id: t.id,
    title: t.title,
    priority: t.priority === 'HIGH' ? 'high' : t.priority === 'LOW' ? 'low' : 'medium',
    dueDate: t.dueAt ? String(t.dueAt) : new Date().toISOString(),
    status: t.status === 'DONE' ? 'completed' : t.status === 'IN_PROGRESS' ? 'in_progress' : 'pending',
    category: 'system',
    estimatedHours: 0,
    completionPercentage: t.status === 'DONE' ? 100 : 0,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
    complianceRequired: false,
  } as Task)

  const uiTasks = tasks.map(mapApiToUi)

  const onTaskUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      const payload: Record<string, unknown> = {}
      if (updates.title !== undefined) payload.title = updates.title
      if (updates.dueDate !== undefined) payload.dueAt = updates.dueDate
      if (updates.priority !== undefined) payload.priority = updates.priority === 'high' ? 'HIGH' : updates.priority === 'low' ? 'LOW' : 'MEDIUM'
      if (updates.status !== undefined) payload.status = updates.status === 'completed' ? 'DONE' : updates.status === 'in_progress' ? 'IN_PROGRESS' : 'OPEN'
      const res = await apiFetch(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
    } catch (e) { console.error('update failed', e) }
  }

  const onTaskCreate = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: task.title,
        dueAt: task.dueDate,
        priority: task.priority === 'high' ? 'HIGH' : task.priority === 'low' ? 'LOW' : 'MEDIUM',
      }) })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      await loadTasks()
    } catch (e) { console.error('create failed', e) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {errorMsg && (
          <div className="mb-2 border border-red-200 bg-red-50 text-red-800 rounded-md p-3 text-sm">
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-600 hover:text-red-800">×</button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Create, assign, and track admin tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline"><Link href="/admin">Back to Dashboard</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/tasks/new">Quick Task</Link></Button>
          </div>
        </div>
        <TaskManagementSystem initialTasks={uiTasks} onTaskUpdate={onTaskUpdate} onTaskCreate={onTaskCreate} />
      </div>
    </div>
  )
}
