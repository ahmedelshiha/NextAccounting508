"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Trash2, Pencil, Plus, Paperclip } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import TaskForm from '@/app/admin/tasks/components/forms/TaskForm'
import { useRealtime } from '@/hooks/useRealtime'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
  attachments?: Array<{ name?: string; url?: string; type?: string; size?: number; uploadError?: string }> | null
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

  const [tasks, setTasks] = useState<Array<any>>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState(false)

  const [comments, setComments] = useState<Array<any>>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [commentFiles, setCommentFiles] = useState<any[]>([])
  const [postingComment, setPostingComment] = useState(false)

  const rt = useRealtime(['service-request-updated','task-updated'])

  const load = async () => {
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}`)
      const j = await res.json().catch(() => ({}))
      if (j?.data) {
        setItem(j.data)
        setStatus((j.data.status as typeof STATUSES[number]) || '')
      } else if (String(params.id || '').startsWith('dev-')) {
        try {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(`sr:${params.id}`) : null
          if (cached) {
            const obj = JSON.parse(cached)
            setItem(obj)
            setStatus((obj?.status as typeof STATUSES[number]) || '')
          } else {
            setItem(null)
          }
        } catch { setItem(null) }
      } else {
        setItem(null)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const loadTasks = async () => {
    setTasksLoading(true)
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}/tasks`)
      const j = await res.json().catch(() => ({}))
      setTasks(Array.isArray(j?.data) ? j.data : [])
    } finally { setTasksLoading(false) }
  }

  const loadComments = async () => {
    setCommentsLoading(true)
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}/comments`)
      const j = await res.json().catch(() => ({}))
      setComments(Array.isArray(j?.data) ? j.data : [])
    } finally { setCommentsLoading(false) }
  }

  useEffect(() => { void loadTasks(); void loadComments() }, [])

  useEffect(() => {
    if (!rt.events.length) return
    const last = rt.events[rt.events.length - 1]
    const srId = (last?.data?.serviceRequestId ?? last?.data?.id) && String(last?.data?.serviceRequestId ?? last?.data?.id)
    if (last?.type === 'task-updated' || last?.type === 'service-request-updated') {
      if (!srId || srId === String(params.id)) {
        void loadTasks()
        void loadComments()
        void load()
      }
    }
  }, [rt.events])

  useEffect(() => {
    if (!perms.has(PERMISSIONS.TEAM_VIEW)) return
    ;(async () => {
      try {
        const r = await apiFetch('/api/admin/team-members')
        const j = await r.json().catch(() => ({})) as any
        const list = Array.isArray(j?.teamMembers) ? j.teamMembers as Array<any> : []
        setTeamMembers(list.map(tm => ({ id: tm.id, name: tm.name || tm.email || 'Member', email: tm.email || '' })))
      } catch {}
    })()
  }, [perms])

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

  const assignNow = async () => {
    if (!assignee || !perms.has(PERMISSIONS.SERVICE_REQUESTS_ASSIGN)) return
    setAssigning(true)
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamMemberId: assignee }) })
      if (!res.ok) throw new Error('Assign failed')
      await load()
    } finally { setAssigning(false) }
  }

  const deleteNow = async () => {
    if (!perms.has(PERMISSIONS.SERVICE_REQUESTS_DELETE)) return
    try {
      const res = await apiFetch(`/api/admin/service-requests/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/service-requests')
    } finally { setConfirmDelete(false) }
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{item.title}</CardTitle>
                <CardDescription>Service request details</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {perms.has(PERMISSIONS.SERVICE_REQUESTS_UPDATE) && (
                  <Button variant="outline" onClick={() => router.push(`/admin/service-requests/${params.id}/edit`)} className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit</Button>
                )}
                {perms.has(PERMISSIONS.SERVICE_REQUESTS_DELETE) && (
                  <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete</Button>
                )}
              </div>
            </div>
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

            {Array.isArray(item.attachments) && item.attachments.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Attachments</span>
                  <Button variant="outline" onClick={() => router.push(`/admin/uploads/quarantine?serviceRequestId=${encodeURIComponent(String(params.id))}`)}>Open Quarantine</Button>
                </div>
                <ul className="space-y-1">
                  {item.attachments.map((a, idx) => (
                    <li key={idx} className="text-sm">
                      {a.uploadError ? (
                        <span className="text-red-600">{a.name || 'file'} — {a.uploadError}</span>
                      ) : (
                        a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{a.name || a.url}</a> : <span>{a.name || 'file'}</span>
                      )}
                    </li>
                  ))}
                </ul>
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

            {perms.has(PERMISSIONS.SERVICE_REQUESTS_ASSIGN) && (
              <div className="pt-2">
                <div className="text-sm text-gray-500 mb-1">Assign to Team Member</div>
                <div className="flex items-center gap-3">
                  <Select value={assignee} onValueChange={(v) => setAssignee(v)}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder={item.assignedTeamMember?.name || 'Select team member'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(tm => (<SelectItem key={tm.id} value={tm.id}>{tm.name} {tm.email ? `(${tm.email})` : ''}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button onClick={assignNow} disabled={!assignee || assigning}>
                    {assigning ? (<Loader2 className="h-4 w-4 animate-spin" />) : 'Assign'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Tasks</CardTitle>
                <CardDescription>Tasks linked to this service request</CardDescription>
              </div>
              {perms.has(PERMISSIONS.TASKS_CREATE) && (
                <Button onClick={() => setShowCreateTask(v => !v)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> {showCreateTask ? 'Close' : 'New Task'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCreateTask && perms.has(PERMISSIONS.TASKS_CREATE) && (
              <div className="border rounded-lg p-4 bg-white">
                <TaskForm
                  mode="create"
                  availableUsers={teamMembers.map(tm => ({ id: tm.id, name: tm.name }))}
                  onSave={async (data) => {
                    const priority = String(data.priority || 'medium').toUpperCase()
                    const payload = {
                      title: data.title,
                      description: data.description,
                      priority: priority === 'CRITICAL' ? 'HIGH' : priority,
                      dueAt: data.dueDate,
                      assigneeId: data.assigneeId || undefined,
                    }
                    const res = await apiFetch(`/api/admin/service-requests/${params.id}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                    if (!res.ok) throw new Error('Failed to create task')
                    setShowCreateTask(false)
                    await loadTasks()
                  }}
                  onCancel={() => setShowCreateTask(false)}
                />
              </div>
            )}

            {tasksLoading ? (
              <div className="text-gray-400">Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div className="text-gray-500">No tasks linked yet.</div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t: any) => (
                  <div key={t.id} className="border rounded-lg p-3 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{t.title}</div>
                      <div className="text-sm text-gray-600">
                        {(t.priority || '').toString()} • {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : 'No due date'} • {t.assignee?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Comments</CardTitle>
            <CardDescription>Discussion on this service request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {commentsLoading ? (
              <div className="text-gray-400">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="text-gray-500">No comments yet.</div>
            ) : (
              <div className="space-y-3">
                {comments.map((c: any) => (
                  <div key={c.id} className="border rounded-lg p-3 bg-white">
                    <div className="text-sm text-gray-700 font-medium">{c.author?.name || c.author?.email || 'User'} <span className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span></div>
                    <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{c.content}</div>
                    {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {c.attachments.map((a: any, i: number) => (
                          <a key={i} href={a.url || a.dataUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">{a.name || 'attachment'}</a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {perms.has(PERMISSIONS.SERVICE_REQUESTS_UPDATE) && (
              <div className="space-y-2 border rounded-lg p-3 bg-white">
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." />
                <Input type="file" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => setCommentFiles(prev => [...prev, { name: f.name, size: f.size, type: f.type, dataUrl: reader.result }])
                  reader.readAsDataURL(f)
                }} />
                <div className="flex justify-end">
                  <Button disabled={postingComment || (!commentText.trim() && commentFiles.length===0)} onClick={async () => {
                    setPostingComment(true)
                    try {
                      const payload = { content: commentText.trim(), attachments: commentFiles }
                      const res = await apiFetch(`/api/admin/service-requests/${params.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                      if (!res.ok) throw new Error('Failed to post comment')
                      setCommentText('')
                      setCommentFiles([])
                      await loadComments()
                    } finally { setPostingComment(false) }
                  }}>Post</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this request?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The request and its tasks will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteNow} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
