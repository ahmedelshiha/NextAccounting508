"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'] as const

export default function AdminNewServiceRequestPage() {
  const router = useRouter()
  const perms = usePermissions()

  const [form, setForm] = useState<{ clientId: string; serviceId: string; title: string; description: string; priority: typeof PRIORITIES[number]; budgetMin?: string; budgetMax?: string; deadline?: string }>({ clientId: '', serviceId: '', title: '', description: '', priority: 'MEDIUM' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string; email?: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])

  // load clients and services for selects
  const [clientQuery, setClientQuery] = useState('')
  const [serviceQuery, setServiceQuery] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [uRes, sRes] = await Promise.all([apiFetch('/api/admin/users'), apiFetch('/api/services')])
        if (!mounted) return
        if (uRes.ok) {
          const uj = await uRes.json().catch(() => ({}))
          const users = Array.isArray(uj?.users) ? uj.users : Array.isArray(uj) ? uj : []
          setClients(users.map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
          if (users.length && !form.clientId) setForm(f => ({ ...f, clientId: users[0].id }))
        }
        if (sRes.ok) {
          const sj = await sRes.json().catch(() => ({}))
          const list = Array.isArray(sj?.data) ? sj.data : Array.isArray(sj) ? sj : []
          setServices(list.map((s: any) => ({ id: s.id, name: s.name })))
          if (list.length && !form.serviceId) setForm(f => ({ ...f, serviceId: list[0].id }))
        }
      } catch (e) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filteredClients = clients.filter(c => (c.name || '').toLowerCase().includes(clientQuery.toLowerCase()) || (c.email || '').toLowerCase().includes(clientQuery.toLowerCase()))
  const filteredServices = services.filter(s => (s.name || '').toLowerCase().includes(serviceQuery.toLowerCase()))

  const submit = async () => {
    if (!perms.has(PERMISSIONS.SERVICE_REQUESTS_CREATE)) { setError('Not allowed'); return }
    setSaving(true); setError(null)
    try {
      const payload: any = { ...form, budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined, budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined, deadline: form.deadline || undefined }
      const res = await apiFetch('/api/admin/service-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to create')
      const id = j?.data?.id
      if (id) router.push(`/admin/service-requests/${id}`)
    } catch (e) {
      setError(String(e))
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Service Request</CardTitle>
            <CardDescription>Provide details to create a new request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Client</label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-2">
                      <input aria-label="Search clients" className="w-full rounded border px-2 py-1 text-sm" placeholder="Search clients" value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} />
                    </div>
                    {filteredClients.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ''}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Service</label>
                <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-2">
                      <input aria-label="Search services" className="w-full rounded border px-2 py-1 text-sm" placeholder="Search services" value={serviceQuery} onChange={(e) => setServiceQuery(e.target.value)} />
                    </div>
                    {filteredServices.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Quarterly Audit for ABC" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Describe the request" />
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
                <Input type="number" value={form.budgetMin || ''} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} placeholder="e.g. 500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Budget Max</label>
                <Input type="number" value={form.budgetMax || ''} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} placeholder="e.g. 2000" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Deadline</label>
              <Input type="datetime-local" value={form.deadline || ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>

            <div className="pt-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
              <Button variant="ghost" onClick={() => router.back()} className="ml-2">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
