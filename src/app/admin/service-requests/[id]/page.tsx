"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Trash2, Pencil } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const STATUSES = ['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'] as const

interface Item {
  id: string
  title: string
  description?: string | null
  status: typeof STATUSES[number]
  priority: 'LOW'|'MEDIUM'|'HIGH'|'URGENT'
  client?: { id: string; name?: string | null; email?: string | null } | null
  service?: { id: string; name?: string | null; slug?: string | null; category?: string | null } | null
  assignedTeamMember?: { id: string; name?: string | null; email?: string | null } | null
  budgetMin?: number | null
  budgetMax?: number | null
  deadline?: string | null
  createdAt?: string | null
}

export default function AdminServiceRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const perms = usePermissions()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<typeof STATUSES[number] | ''>('')
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [assignee, setAssignee] = useState<string>('')
  const [assigning, setAssigning] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = async () => {
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}`)
      const j = await res.json().catch(() => ({}))
      setItem(j?.data ?? null)
      setStatus((j?.data?.status as typeof STATUSES[number]) || '')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const saveStatus = async () => {
    if (!status || !perms.has(PERMISSIONS.SERVICE_REQUESTS_UPDATE)) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed')
      await load()
    } finally { setSaving(false) }
  }

  const statusBadge = (s: Item['status']) => (
    <Badge className={{ COMPLETED: 'bg-green-100 text-green-800 border-green-200', CANCELLED: 'bg-red-100 text-red-800 border-red-200', IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200', ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200', APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200', IN_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200', SUBMITTED: 'bg-sky-100 text-sky-800 border-sky-200', DRAFT: 'bg-gray-100 text-gray-800 border-gray-200' }[s] || ''}>{s.replace('_',' ')}</Badge>
  )

  if (loading) return (<div className="min-h-screen bg-gray-50 py-8"><div className="max-w-5xl mx-auto px-4"><div className="text-gray-400">Loading…</div></div></div>)
  if (!item) return (<div className="min-h-screen bg-gray-50 py-8"><div className="max-w-5xl mx-auto px-4"><div className="text-gray-500">Not found</div></div></div>)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{item.title}</CardTitle>
            <CardDescription>Service request details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {statusBadge(item.status)}
              <Badge className={{ URGENT: 'bg-red-100 text-red-800 border-red-200', HIGH: 'bg-orange-100 text-orange-800 border-orange-200', MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200', LOW: 'bg-gray-100 text-gray-800 border-gray-200' }[item.priority] || ''}>{item.priority}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Client</div>
                <div className="text-gray-900">{item.client?.name || item.client?.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Service</div>
                <div className="text-gray-900">{item.service?.name || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Assignee</div>
                <div className="text-gray-900">{item.assignedTeamMember?.name || 'Unassigned'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Deadline</div>
                <div className="text-gray-900">{item.deadline ? new Date(item.deadline).toLocaleString() : '—'}</div>
              </div>
            </div>

            {item.description && (
              <div>
                <div className="text-sm text-gray-500">Description</div>
                <div className="text-gray-900 whitespace-pre-wrap">{item.description}</div>
              </div>
            )}

            <div className="pt-2">
              <div className="text-sm text-gray-500 mb-1">Update Status</div>
              <div className="flex items-center gap-3">
                <Select value={status} onValueChange={(v) => setStatus(v as typeof STATUSES[number])}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (<SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button onClick={saveStatus} disabled={!status || saving || !perms.has(PERMISSIONS.SERVICE_REQUESTS_UPDATE)}>
                  {saving ? (<Loader2 className="h-4 w-4 animate-spin" />) : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
