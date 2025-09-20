"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import type { ServiceRequestItem } from './table'

function statusColor(s: ServiceRequestItem['status']) {
  switch (s) {
    case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'IN_REVIEW': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'SUBMITTED': return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'DRAFT': default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function priorityColor(p: ServiceRequestItem['priority']) {
  switch (p) {
    case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
    case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'MEDIUM': default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

function formatDay(dateIso: string) {
  const d = new Date(dateIso)
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ServiceRequestsCalendarView({ items, onOpen }: { items: ServiceRequestItem[]; onOpen: (id: string) => void }) {
  const groups = useMemo(() => {
    const byDay: Record<string, ServiceRequestItem[]> = {}
    for (const it of items) {
      const iso = (it as any).scheduledAt || it.deadline || it.createdAt || new Date().toISOString()
      const dayKey = new Date(iso).toISOString().slice(0, 10)
      byDay[dayKey] = byDay[dayKey] || []
      byDay[dayKey].push(it)
    }
    const entries = Object.entries(byDay)
    entries.sort((a, b) => a[0].localeCompare(b[0]))
    return entries
  }, [items])

  if (items.length === 0) {
    return <div className="text-center text-sm text-gray-500 py-8">No service requests found.</div>
  }

  return (
    <div className="space-y-6">
      {groups.map(([day, list]) => (
        <div key={day} className="bg-white border rounded-md">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <div className="font-medium text-gray-900">{formatDay(day)}</div>
            <div className="ml-auto text-xs text-gray-500">{list.length} item{list.length === 1 ? '' : 's'}</div>
          </div>
          <ul className="divide-y">
            {list.map((r) => (
              <li key={r.id} className="p-4 flex items-start gap-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-gray-900 truncate max-w-[520px]">{r.title}</div>
                    <Badge className={statusColor(r.status)}>{r.status.replace('_', ' ')}</Badge>
                    <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-3">
                    <span>Client: {r.client?.name || r.client?.email || '—'}</span>
                    <span>Service: {r.service?.name || '—'}</span>
                    {(r as any).scheduledAt && <span>Scheduled: {new Date((r as any).scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    {r.deadline && <span>Due: {new Date(r.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => onOpen(r.id)} className="flex items-center gap-1">
                    View <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
