'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface DbItem { id: string; key?: string | null; url?: string | null; name?: string | null; size?: number | null; contentType?: string | null; avStatus?: string | null; uploadedAt?: string | null; serviceRequestId?: string | null }
interface ProviderItem { key: string; size?: number; createdAt?: string }

export default function QuarantineClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const [dbItems, setDbItems] = useState<DbItem[] | null>(null)
  const [providerItems, setProviderItems] = useState<ProviderItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const serviceRequestId = sp.get('serviceRequestId') || ''
  const q = sp.get('q') || ''

  const setParam = (name: string, value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(name, value); else params.delete(name)
    router.replace(`?${params.toString()}`)
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (serviceRequestId) qs.set('serviceRequestId', serviceRequestId)
      if (q) qs.set('q', q)
      const res = await fetch(`/api/admin/uploads/quarantine${qs.toString() ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      const data = json?.data || {}
      setDbItems(Array.isArray(data.db) ? data.db : [])
      setProviderItems(Array.isArray(data.provider) ? data.provider : [])
    } catch (e) {
      setDbItems([]); setProviderItems([])
      toast.error('Failed to load quarantine')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [serviceRequestId, q])

  const keysSelected = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected])

  const doAction = async (action: 'release' | 'delete', key: string) => {
    if (!confirm(`Are you sure you want to ${action} ${key}?`)) return
    try {
      const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, key }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(json.error || 'Action failed'); return }
      toast.success('Action succeeded')
      fetchItems()
    } catch { toast.error('Action failed') }
  }

  const filteredProvider = useMemo(() => {
    if (!providerItems) return [] as ProviderItem[]
    const term = (q || serviceRequestId).toLowerCase()
    if (!term) return providerItems
    return providerItems.filter((p) => p.key?.toLowerCase().includes(term))
  }, [providerItems, q, serviceRequestId])

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold">Quarantined Uploads</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Filter by Service Request ID" className="w-64" value={serviceRequestId} onChange={(e) => setParam('serviceRequestId', e.target.value)} />
          <Input placeholder="Search (name/key)" className="w-56" value={q} onChange={(e) => setParam('q', e.target.value)} />
          <Button onClick={fetchItems} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
          {(serviceRequestId || q) && (
            <Button variant="outline" onClick={() => { setParam('serviceRequestId',''); setParam('q','') }}>Clear</Button>
          )}
          {keysSelected.length > 0 && (
            <>
              <Button onClick={async () => {
                if (!confirm(`Release ${keysSelected.length} item(s)?`)) return
                const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'release', keys: keysSelected }) })
                if (!res.ok) { const j = await res.json().catch(() => ({})); toast.error(j.error || 'Bulk release failed'); return }
                toast.success('Bulk release initiated')
                fetchItems()
              }}>Bulk Release ({keysSelected.length})</Button>
              <Button variant="destructive" onClick={async () => {
                if (!confirm(`Delete ${keysSelected.length} item(s)?`)) return
                const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', keys: keysSelected }) })
                if (!res.ok) { const j = await res.json().catch(() => ({})); toast.error(j.error || 'Bulk delete failed'); return }
                toast.success('Bulk delete completed')
                fetchItems()
              }}>Bulk Delete ({keysSelected.length})</Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Database Records</h2>
            {dbItems && dbItems.length > 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={dbItems.every(it => it.key && selected[it.key])} onChange={(e) => {
                    const next: Record<string, boolean> = { ...selected }
                    dbItems.forEach(it => { if (it.key) next[it.key] = e.target.checked })
                    setSelected(next)
                  }} />
                  <span className="text-sm text-gray-600">Select all DB items with keys</span>
                </div>
                {dbItems.map((it) => (
                  <Card key={it.id}>
                    <CardHeader>
                      <CardTitle className="text-sm truncate">{it.name || it.key || it.url || it.id}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {it.key ? (
                            <input type="checkbox" checked={!!selected[it.key]} onChange={(e) => setSelected(prev => ({ ...prev, [it.key!]: e.target.checked }))} />
                          ) : <span className="w-4" />}
                          <div>
                            <div className="text-sm text-gray-600">Status: {it.avStatus || '—'}</div>
                            <div className="text-sm text-gray-600">SR: {it.serviceRequestId || '—'}</div>
                            <div className="text-sm text-gray-600">Size: {typeof it.size === 'number' ? `${Math.round(it.size/1024)} KB` : '—'}</div>
                            <div className="text-sm text-gray-600">Uploaded: {it.uploadedAt ? new Date(it.uploadedAt).toLocaleString() : '—'}</div>
                          </div>
                        </div>
                        {it.key ? (
                          <div className="flex items-center gap-2">
                            <Button variant="destructive" onClick={() => doAction('delete', it.key!)}>Delete</Button>
                            <Button onClick={() => doAction('release', it.key!)}>Release</Button>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="p-6 text-center">No matching DB records.</CardContent></Card>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Provider Blobs</h2>
            {filteredProvider && filteredProvider.length > 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={filteredProvider.every(it => selected[it.key])} onChange={(e) => {
                    const next: Record<string, boolean> = { ...selected }
                    filteredProvider.forEach(it => { next[it.key] = e.target.checked })
                    setSelected(next)
                  }} />
                  <span className="text-sm text-gray-600">Select all provider blobs</span>
                </div>
                {filteredProvider.map((it) => (
                  <Card key={it.key}>
                    <CardHeader>
                      <CardTitle className="text-sm truncate">{it.key}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={!!selected[it.key]} onChange={(e) => setSelected(prev => ({ ...prev, [it.key]: e.target.checked }))} />
                          <div>
                            <div className="text-sm text-gray-600">Size: {it.size || '—'}</div>
                            <div className="text-sm text-gray-600">Created: {it.createdAt || '—'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="destructive" onClick={() => doAction('delete', it.key)}>Delete</Button>
                          <Button onClick={() => doAction('release', it.key)}>Release</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="p-6 text-center">No matching provider blobs.</CardContent></Card>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
