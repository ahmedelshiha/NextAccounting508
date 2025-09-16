"use client"

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCw, Filter } from 'lucide-react'

export type RequestFilters = {
  status: string | 'ALL'
  priority: string | 'ALL'
  q: string
}

const STATUSES = ['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'] as const
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'] as const

interface FiltersProps {
  value: RequestFilters
  onChange: (next: RequestFilters) => void
  onRefresh?: () => void
  refreshing?: boolean
}

export default function ServiceRequestFilters({ value, onChange, onRefresh, refreshing }: FiltersProps) {
  const statusItems = useMemo(() => ['ALL', ...STATUSES], [])
  const priorityItems = useMemo(() => ['ALL', ...PRIORITIES], [])

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1 min-w-0">
        <Input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="Search by title or description"
          className="pl-3"
        />
      </div>
      <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v as RequestFilters['status'] })}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusItems.map(s => (<SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>))}
        </SelectContent>
      </Select>
      <Select value={value.priority} onValueChange={(v) => onChange({ ...value, priority: v as RequestFilters['priority'] })}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {priorityItems.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={() => onChange({ status: 'ALL', priority: 'ALL', q: '' })} className="flex items-center gap-2">
        <Filter className="h-4 w-4" /> Reset
      </Button>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh} disabled={!!refreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      )}
    </div>
  )
}
