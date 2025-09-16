"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export interface ServiceRequestItem {
  id: string
  title: string
  status: 'DRAFT'|'SUBMITTED'|'IN_REVIEW'|'APPROVED'|'ASSIGNED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'
  priority: 'LOW'|'MEDIUM'|'HIGH'|'URGENT'
  client?: { id: string; name?: string | null; email?: string | null } | null
  service?: { id: string; name?: string | null; slug?: string | null; category?: string | null } | null
  assignedTeamMember?: { id: string; name?: string | null; email?: string | null } | null
  deadline?: string | null
  createdAt?: string | null
}

interface Props {
  items: ServiceRequestItem[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (checked: boolean) => void
  onOpen: (id: string) => void
}

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

export default function ServiceRequestsTable({ items, selectedIds, onToggle, onToggleAll, onOpen }: Props) {
  const allSelected = items.length > 0 && items.every(i => selectedIds.has(i.id))

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={(v) => onToggleAll(Boolean(v))} aria-label="Select all" />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="hidden sm:table-cell">Deadline</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id} className="hover:bg-gray-50">
              <TableCell className="w-10">
                <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => onToggle(r.id)} aria-label={`Select ${r.title}`} />
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900 truncate max-w-[280px]">{r.title}</div>
                <div className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{r.client?.name || r.client?.email || '—'}</div>
                <div className="text-xs text-gray-500">{r.client?.email || ''}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{r.service?.name || '—'}</div>
                <div className="text-xs text-gray-500">{r.service?.category || ''}</div>
              </TableCell>
              <TableCell>
                <Badge className={statusColor(r.status)}>{r.status.replace('_',' ')}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{r.assignedTeamMember?.name || 'Unassigned'}</div>
                <div className="text-xs text-gray-500">{r.assignedTeamMember?.email || ''}</div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="text-sm text-gray-900">{r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'}</div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onOpen(r.id)} className="flex items-center gap-1">
                  View <ArrowRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">No service requests found.</div>
      )}
    </div>
  )
}
