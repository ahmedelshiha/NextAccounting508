import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFilterContext } from '../providers/FilterProvider'
import { apiFetch } from '@/lib/api'

export default function TaskFiltersPanel() {
  const { filters, setFilters, resetFilters } = useFilterContext()
  const [users, setUsers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const r = await apiFetch('/api/admin/users', { signal: ac.signal })
        const data = await r.json().catch(() => ({}))
        const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : [])
        setUsers(list.filter((u: any) => (u.role || '').toUpperCase() !== 'CLIENT'))
        setClients(list.filter((u: any) => (u.role || '').toUpperCase() === 'CLIENT'))
      } catch {}
    })()
    return () => ac.abort()
  }, [])

  const update = (key: string, value: any) => setFilters((prev: any) => ({ ...prev, [key]: value }))

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-600">Status</label>
          <select value={filters.status?.[0] || ''} onChange={(e) => update('status', e.target.value ? [e.target.value] : [])} className="w-full border rounded px-2 py-1">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Priority</label>
          <select value={filters.priority?.[0] || ''} onChange={(e) => update('priority', e.target.value ? [e.target.value] : [])} className="w-full border rounded px-2 py-1">
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Assignee</label>
          <select value={filters.assignee?.[0] || ''} onChange={(e) => update('assignee', e.target.value ? [e.target.value] : [])} className="w-full border rounded px-2 py-1">
            <option value="">All</option>
            {users.map(u => (<option key={u.id} value={u.id}>{u.name || u.email}</option>))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Client</label>
          <select value={filters.client?.[0] || ''} onChange={(e) => update('client', e.target.value ? [e.target.value] : [])} className="w-full border rounded px-2 py-1">
            <option value="">All</option>
            {clients.map(c => (<option key={c.id} value={c.id}>{c.name || c.email}</option>))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Start</label>
          <Input type="date" value={filters.dateRange?.start || ''} onChange={(e) => update('dateRange', { ...filters.dateRange, start: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-600">End</label>
          <Input type="date" value={filters.dateRange?.end || ''} onChange={(e) => update('dateRange', { ...filters.dateRange, end: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input id="overdue" type="checkbox" checked={!!filters.overdue} onChange={(e) => update('overdue', e.target.checked)} />
          <label htmlFor="overdue" className="text-sm">Overdue only</label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input id="compliance" type="checkbox" checked={!!filters.compliance} onChange={(e) => update('compliance', e.target.checked)} />
          <label htmlFor="compliance" className="text-sm">Compliance only</label>
        </div>
      </div>
    </Card>
  )
}
