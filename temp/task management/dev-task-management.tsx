'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { TasksHeader, TasksToolbar, TasksStats } from './task-layout-components'
import { TaskListView } from './task-view-components'
import type { Task, TaskFilters, TaskPriority } from './task-types'
import { calculateTaskStatistics, applyFilters } from './task-utils'
import { useDevTasks } from './hooks/useDevTasks'
import TaskAnalytics from './components/analytics/TaskAnalytics'

export default function DevTaskManagement() {
  // Auth guard (client-side) — prefer NextAuth session when available
  const { data: session, status } = useSession()
  const [authorized, setAuthorized] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const applySession = (sess: any) => {
      const role = sess?.user?.role || sess?.role
      if (!role) return false
      if (['ADMIN', 'STAFF'].includes(role)) return true
      return false
    }

    // If NextAuth is present and session is known, use it
    if (status === 'authenticated') {
      const ok = applySession(session)
      setAuthorized(ok)
      setAuthError(ok ? null : 'Insufficient permissions')
      return () => { mounted = false }
    }

    // Fallback: call /api/users/me (keeps compatibility with existing app)
    ;(async () => {
      try {
        const r = await fetch('/api/users/me', { signal: ctrl.signal, credentials: 'same-origin' })
        if (!mounted) return
        if (!r.ok) {
          setAuthorized(false)
          setAuthError('Unauthorized')
          return
        }
        const data = await r.json().catch(() => ({}))
        const role = data?.user?.role
        if (!['ADMIN', 'STAFF'].includes(role)) {
          setAuthorized(false)
          setAuthError('Insufficient permissions')
        } else {
          setAuthorized(true)
          setAuthError(null)
        }
      } catch (err) {
        if (!mounted) return
        setAuthorized(false)
        setAuthError('Unauthorized')
      }
    })()

    return () => { mounted = false; ctrl.abort() }
  }, [session, status])

  const { tasks, loading, error, create, update, remove } = useDevTasks(20, authorized)

  // Search, sort, filters
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'assignee' | 'category'>('dueDate')
  const [viewMode] = useState<'list' | 'board' | 'calendar' | 'table'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '', status: [], priority: [], category: [], assignee: [], client: [], dateRange: {}, overdue: false, compliance: false, tags: []
  })

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const q = searchQuery.toLowerCase()
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assignee?.name.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }, [tasks, searchQuery])

  const fullyFiltered = useMemo(() => applyFilters(filteredBySearch, filters), [filteredBySearch, filters])

  const statistics = useMemo(() => calculateTaskStatistics(fullyFiltered), [fullyFiltered])

  const activeFilterCount = useMemo(() => {
    let c = 0
    if (filters.status.length) c++
    if (filters.priority.length) c++
    if (filters.category.length) c++
    if (filters.assignee.length) c++
    if (filters.client.length) c++
    if (filters.dateRange.start || filters.dateRange.end) c++
    if (filters.overdue) c++
    if (filters.compliance) c++
    if (filters.tags.length) c++
    return c
  }, [filters])

  const handleTaskStatusChange = useCallback(async (taskId: string, status: Task['status']) => {
    await update(taskId, { status })
  }, [update])

  // Quick create form
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return
    await create({
      title: newTitle.trim(),
      description: undefined,
      priority: newPriority,
      category: 'system',
      dueDate: newDue ? new Date(newDue).toISOString() : '',
      estimatedHours: 0,
      assigneeId: undefined,
      clientId: undefined,
      bookingId: undefined,
      tags: [],
      complianceRequired: false,
      complianceDeadline: undefined,
    })
    setNewTitle('')
    setNewDue('')
    setNewPriority('medium')
  }, [newTitle, newDue, newPriority, create])

  // HMR / ChunkLoadError handling: reload when a stale chunk causes failure to load
  useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      try {
        const msg = (ev && ev.error && (ev.error.message || ev.error.name)) || ev.message || ''
        if (msg && (msg.includes('Loading chunk') || msg.includes('ChunkLoadError') || msg.toLowerCase().includes('failed to fetch'))) {
          // Reload once to recover from an out-of-sync HMR chunk
          console.warn('ChunkLoadError detected in dev UI, reloading page to recover HMR state')
          window.location.reload()
        }
      } catch (e) {
        /* swallow */
      }
    }
    const onRej = (ev: PromiseRejectionEvent) => {
      try {
        const reason = ev.reason && (ev.reason.message || ev.reason.toString()) || ''
        if (reason && (reason.includes('Loading chunk') || reason.includes('ChunkLoadError') || reason.toLowerCase().includes('failed to fetch'))) {
          console.warn('Unhandled rejection related to chunk loading; reloading')
          window.location.reload()
        }
      } catch (e) { /* swallow */ }
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRej)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRej)
    }
  }, [])

  if (!authorized) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">{authError || 'Unauthorized'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>
      )}

      <TasksHeader
        totalTasks={statistics.total}
        overdueTasks={statistics.overdue}
        completedTasks={statistics.completed}
        onNewTask={handleCreate}
      />

      {/* Quick Add */}
      <div className="bg-white rounded-lg border p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Add Task</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TasksStats stats={statistics} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <TaskAnalytics />
          {/* Export / Templates / Notifications panel */}
          <ExportPanel />
        </div>
      </div>

      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersToggle={() => setShowFilters(v => !v)}
        filtersActive={activeFilterCount}
        sortBy={sortBy}
        onSortChange={(s) => setSortBy(s as any)}
        viewMode={viewMode}
        onViewModeChange={() => {}}
        showFilters={true}
      />

      <div className="flex gap-6">
        {showFilters && (
          <div className="w-80 flex-shrink-0 bg-white border rounded-lg p-4 space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Status</div>
              {['pending','in_progress','review','blocked','completed'].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm mb-1">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(s as Task['status'])}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setFilters(prev => ({
                        ...prev,
                        status: checked ? [...prev.status, s as Task['status']] : prev.status.filter(x => x !== s)
                      }))
                    }}
                  />
                  <span className="capitalize">{s.replace('_',' ')}</span>
                </label>
              ))}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Priority</div>
              {['low','medium','high','critical'].map(p => (
                <label key={p} className="flex items-center gap-2 text-sm mb-1">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(p as TaskPriority)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setFilters(prev => ({
                        ...prev,
                        priority: checked ? [...prev.priority, p as TaskPriority] : prev.priority.filter(x => x !== p)
                      }))
                    }}
                  />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="overdue"
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters(prev => ({ ...prev, overdue: e.target.checked }))}
              />
              <label htmlFor="overdue" className="text-sm">Overdue only</label>
            </div>
            <button
              className="text-sm text-blue-600"
              onClick={() => setFilters({
                search: '', status: [], priority: [], category: [], assignee: [], client: [], dateRange: {}, overdue: false, compliance: false, tags: []
              })}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <TaskListView
            tasks={fullyFiltered}
            loading={loading}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={async (id) => { await remove(id) }}
          />
        </div>
      </div>
    </div>
  )
}
