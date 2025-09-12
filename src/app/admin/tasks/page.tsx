'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, CheckCircle2, Clock, FileText, Filter, Loader2, Plus, RefreshCw, Target, XCircle } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {errorMsg && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-800 rounded-md p-3 text-sm">
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Target className="h-7 w-7 mr-3 text-blue-600" />
              Task Management
            </h1>
            <p className="text-gray-600 mt-2">Create, assign, and track admin tasks</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={refresh} disabled={refreshing} className="flex items-center gap-2">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div><FileText className="h-6 w-6 text-gray-600"/></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Open</p><p className="text-2xl font-bold text-blue-600">{stats.open}</p></div><Target className="h-6 w-6 text-blue-600"/></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">In Progress</p><p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p></div><Clock className="h-6 w-6 text-purple-600"/></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold text-green-600">{stats.done}</p></div><CheckCircle2 className="h-6 w-6 text-green-600"/></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Overdue</p><p className="text-2xl font-bold text-red-600">{stats.overdue}</p></div><XCircle className="h-6 w-6 text-red-600"/></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Due Today</p><p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p></div><Calendar className="h-6 w-6 text-orange-600"/></div></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <CardTitle>Filters</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-64 max-w-full">
                  <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priority</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueAt">Due date</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Order" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>Use filters to focus on the most important work.</CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-24"/>))}
            </div>
          ) : filtered.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <div key={t.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate" title={t.title}>{t.title}</span>
                        <Badge className={priorityBadge(t.priority)}>{t.priority}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t.dueAt ? new Date(t.dueAt).toLocaleString() : 'No due date'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          Status:
                          <span className="font-medium">{t.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {t.status !== 'DONE' && (
                        <Button size="sm" variant="outline" onClick={() => updateTask(t.id, { status: 'IN_PROGRESS' })}>Start</Button>
                      )}
                      <Button size="sm" onClick={() => updateTask(t.id, { status: t.status === 'DONE' ? 'OPEN' : 'DONE' })}>
                        {t.status === 'DONE' ? 'Reopen' : 'Mark Done'}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Select value={t.priority} onValueChange={(v) => updateTask(t.id, { priority: v as TaskItem['priority'] })}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="datetime-local" className="h-8 text-xs" value={t.dueAt ? new Date(t.dueAt).toISOString().slice(0,16) : ''} onChange={(e) => updateTask(t.id, { dueAt: e.target.value ? new Date(e.target.value).toISOString() : null as any })} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border rounded-lg">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
              <p className="text-gray-600 mb-4">Adjust filters or create your first task.</p>
              <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2"/>Create Task</Button>
            </div>
          )}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Create a new task for your team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Title" value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Notes (optional)" value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} />
              <div className="flex items-center gap-3">
                <Select value={createForm.priority} onValueChange={(v) => setCreateForm(f => ({ ...f, priority: v as CreateForm['priority'] }))}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="datetime-local" value={createForm.dueAt} onChange={(e) => setCreateForm(f => ({ ...f, dueAt: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createTask} disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
