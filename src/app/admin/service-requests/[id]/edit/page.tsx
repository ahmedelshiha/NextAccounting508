"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { Loader2, ArrowLeft } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'] as const

export default function AdminEditServiceRequestPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const perms = usePermissions()

  const [form, setForm] = useState<{ title: string; description: string; priority: typeof PRIORITIES[number]; budgetMin?: string; budgetMax?: string; deadline?: string }>({ title: '', description: '', priority: 'MEDIUM' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await apiFetch(`/api/admin/service-requests/${params.id}`)
        const j = await res.json().catch(() => ({}))
        const d = j?.data
        if (d && !ignore) {
          setForm({
            title: d.title || '',
            description: d.description || '',
            priority: (d.priority || 'MEDIUM') as typeof PRIORITIES[number],
            budgetMin: d.budgetMin != null ? String(d.budgetMin) : '',
            budgetMax: d.budgetMax != null ? String(d.budgetMax) : '',
            deadline: d.deadline ? new Date(d.deadline).toISOString().slice(0,16) : ''
          })
        }
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [params.id])

  const submit = async () => {
    if (!perms.has(PERMISSIONS.SERVICE_REQUESTS_UPDATE)) { setError('Not allowed'); return }
    setSaving(true); setError(null)
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
        deadline: form.deadline || null
      }
      const res = await apiFetch(`/api/admin/service-requests/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to update')
      router.push(`/admin/service-requests/${params.id}`)
    } catch (e) {
      setError(String(e))
    } finally { setSaving(false) }
  }

  if (loading) return (<div className="min-h-screen bg-gray-50 py-8"><div className="max-w-3xl mx-auto px-4"><div className="text-gray-400">Loading…</div></div></div>)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="outline" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Service Request</CardTitle>
            <CardDescription>Update details for this request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Priority</label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof PRIORITIES[number] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Budget Min</label>
                <Input type="number" value={form.budgetMin || ''} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Budget Max</label>
                <Input type="number" value={form.budgetMax || ''} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Deadline</label>
              <Input type="datetime-local" value={form.deadline || ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>

            <div className="pt-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button variant="ghost" onClick={() => router.push(`/admin/service-requests/${params.id}`)} className="ml-2">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
