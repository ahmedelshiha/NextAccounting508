"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { Loader2 } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'] as const

type ClientItem = { id: string; name: string; tier?: string }
type ServiceItem = { id: string; name: string; price?: number | null; slug?: string; shortDesc?: string; features?: string[] }

export default function AdminNewServiceRequestPage() {
  const router = useRouter()
  const perms = usePermissions()

  const [form, setForm] = useState<{ clientId: string; serviceId: string; description: string; priority: typeof PRIORITIES[number]; budgetMin?: string; budgetMax?: string; deadline?: string }>({ clientId: '', serviceId: '', description: '', priority: 'MEDIUM' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loadingLists, setLoadingLists] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  useEffect(() => {
    const abort = new AbortController()
    ;(async () => {
      try {
        setLoadingLists(true)
        // Fetch clients (admin-only endpoint)
        try {
          const resUsers = await apiFetch('/api/admin/users', { signal: abort.signal })
          const jsonUsers = await resUsers.json().catch(() => ({}))
          const users = Array.isArray(jsonUsers) ? jsonUsers : (jsonUsers?.users || [])
          const onlyClients = users.filter((u: any) => String(u.role || '').toUpperCase() === 'CLIENT')
          const mappedClients: ClientItem[] = onlyClients.map((u: any) => ({ id: u.id, name: u.name || u.email || 'Client', tier: (() => { const cnt = Number(u.totalBookings || 0); if (cnt >= 20) return 'Enterprise'; if (cnt >= 1) return 'SMB'; return 'Individual' })() }))
          setClients(mappedClients)
        } catch {}
        // Fetch services (public endpoint)
        try {
          const resSvcs = await apiFetch('/api/services', { signal: abort.signal })
          const jsonSvcs = await resSvcs.json().catch(() => [])
          const list = Array.isArray(jsonSvcs) ? jsonSvcs : (jsonSvcs?.data || [])
          const mapped: ServiceItem[] = list.map((s: any) => ({ id: s.id, name: s.name || 'Service', price: s.price ?? null, slug: s.slug, shortDesc: s.shortDesc, features: s.features }))
          setServices(mapped)
        } catch {}
      } finally {
        setLoadingLists(false)
      }
    })()
    return () => abort.abort()
  }, [])

  useEffect(() => {
    if (!form.serviceId) { setSelectedService(null); return }
    const found = services.find(s => String(s.id) === String(form.serviceId)) || null
    setSelectedService(found)
    // If service has a price and user didn't specify budgets, pre-fill suggested bands
    if (found && found.price != null) {
      const price = Number(found.price)
      setForm((prev) => ({
        ...prev,
        budgetMin: prev.budgetMin || String(Math.round(price)),
        budgetMax: prev.budgetMax || String(Math.round(price * 1.5)),
      }))
    }
  }, [form.serviceId, services])

  const submit = async () => {
    if (!perms.has(PERMISSIONS.SERVICE_REQUESTS_CREATE)) { setError('Not allowed'); return }
    if (!form.clientId || !form.serviceId) { setError('Select client and service'); return }
    setSaving(true); setError(null)
    try {
      const serviceSnapshot = selectedService ? { id: selectedService.id, name: selectedService.name, price: selectedService.price ?? null, slug: selectedService.slug ?? null, shortDesc: selectedService.shortDesc ?? null } : undefined
      const deadlineIso = form.deadline ? new Date(form.deadline).toISOString() : undefined
      const payload: any = {
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        deadline: deadlineIso,
        requirements: {
          ...(form as any).requirements,
          serviceSnapshot,
        }
      }
      const res = await apiFetch('/api/admin/service-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(getApiErrorMessage(j, 'Failed to create')); return }
      const id = j?.data?.id
      if (id) router.push(`/admin/service-requests/${id}`)
    } catch (e) {
      setError(getApiErrorMessage(e, 'Failed to create'))
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
                    <SelectValue placeholder={loadingLists ? 'Loading...' : 'Select client'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}{c.tier ? ` (${c.tier})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Service</label>
                <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLists ? 'Loading...' : 'Select service'} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}{s.price != null ? ` — $${s.price}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">Notes</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Describe the request" />
            </div>

            {selectedService && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                <p className="text-sm font-medium">Selected service: {selectedService.name}{selectedService.price != null ? ` — $${selectedService.price}` : ''}</p>
                {selectedService.shortDesc && <p className="text-sm text-gray-700 mt-1">{selectedService.shortDesc}</p>}
                {selectedService.features && selectedService.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600">Features:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {selectedService.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {selectedService.price == null && <p className="text-xs text-yellow-700 mt-2">Note: this service does not have a price set.</p>}
              </div>
            )}

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
