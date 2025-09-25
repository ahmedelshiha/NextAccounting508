'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { toastFromResponse, toastError, toastSuccess } from '@/lib/toast-api'

interface DbItem { id: string; key?: string | null; url?: string | null; name?: string | null; size?: number | null; contentType?: string | null; avStatus?: string | null; uploadedAt?: string | null; serviceRequestId?: string | null }
interface ProviderItem { key: string; size?: number; createdAt?: string }

interface Meta { total: number; page: number; limit: number; totalPages: number }

export default function QuarantineClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const [dbItems, setDbItems] = useState<DbItem[] | null>(null)
  const [providerItems, setProviderItems] = useState<ProviderItem[] | null>(null)
  const [dbMeta, setDbMeta] = useState<Meta | null>(null)
  const [providerMeta, setProviderMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const serviceRequestId = sp.get('serviceRequestId') || ''
  const q = sp.get('q') || ''
  const dbPage = Math.max(1, parseInt(sp.get('dbPage') || '1', 10))
  const dbLimit = Math.min(200, Math.max(1, parseInt(sp.get('dbLimit') || '25', 10)))
  const dbSort = (sp.get('dbSort') || 'uploadedAt_desc')
  const providerPage = Math.max(1, parseInt(sp.get('providerPage') || '1', 10))
  const providerLimit = Math.min(200, Math.max(1, parseInt(sp.get('providerLimit') || '25', 10)))
  const providerSort = (sp.get('providerSort') || 'created_desc')

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
      qs.set('dbPage', String(dbPage))
      qs.set('dbLimit', String(dbLimit))
      qs.set('providerPage', String(providerPage))
      qs.set('providerLimit', String(providerLimit))
      if (dbSort) qs.set('dbSort', dbSort)
      if (providerSort) qs.set('providerSort', providerSort)
      const res = await fetch(`/api/admin/uploads/quarantine${qs.toString() ? `?${qs}` : ''}`)
      if (!res.ok) { await toastFromResponse(res, { failure: 'Failed to load quarantine' }); setDbItems([]); setProviderItems([]); setDbMeta(null); setProviderMeta(null); return }
      const json = await res.json()
      const data = json?.data || {}
      const meta = json?.meta || {}
      setDbItems(Array.isArray(data.db) ? data.db : [])
      setProviderItems(Array.isArray(data.provider) ? data.provider : [])
      setDbMeta(meta.db || null)
      setProviderMeta(meta.provider || null)
    } catch (e) {
      setDbItems([]); setProviderItems([]); setDbMeta(null); setProviderMeta(null)
      toastError(e, 'Failed to load quarantine')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [serviceRequestId, q, dbPage, dbLimit, providerPage, providerLimit])

  const keysSelected = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected])

  const doAction = async (action: 'release' | 'delete', key: string) => {
    if (!confirm(`Are you sure you want to ${action} ${key}?`)) return
    try {
      const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, key }) })
      if (!res.ok) { await toastFromResponse(res, { failure: 'Action failed' }); return }
      toastSuccess('Action succeeded')
      fetchItems()
    } catch { toast.error('Action failed') }
  }

  const filteredProvider = useMemo(() => {
    if (!providerItems) return [] as ProviderItem[]
    const term = (q || serviceRequestId).toLowerCase()
    if (!term) return providerItems
    return providerItems.filter((p) => p.key?.toLowerCase().includes(term))
  }, [providerItems, q, serviceRequestId])

  const Pager = ({ meta, prefix }: { meta: Meta | null; prefix: 'db' | 'provider' }) => {
    if (!meta) return null
    const prev = () => setParam(`${prefix}Page`, String(Math.max(1, (meta.page - 1))))
    const next = () => setParam(`${prefix}Page`, String(Math.min(meta.totalPages, (meta.page + 1))))
    return (
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-gray-600">
          Showing {Math.min(meta.total, (meta.page - 1) * meta.limit + 1)}–{Math.min(meta.total, meta.page * meta.limit)} of {meta.total}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={meta.page <= 1} onClick={prev}>Previous</Button>
          <span className="text-sm text-gray-700">Page {meta.page} of {meta.totalPages}</span>
          <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={next}>Next</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold">Quarantined Uploads</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Filter by Service Request ID" className="w-64" value={serviceRequestId} onChange={(e) => setParam('serviceRequestId', e.target.value)} />
          <Input placeholder="Search (name/key)" className="w-56" value={q} onChange={(e) => setParam('q', e.target.value)} />
          <Select value={dbSort} onValueChange={(v) => setParam('dbSort', v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Sort DB" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uploadedAt_desc">Newest first</SelectItem>
              <SelectItem value="uploadedAt_asc">Oldest first</SelectItem>
              <SelectItem value="name_asc">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
              <SelectItem value="size_desc">Size big→small</SelectItem>
              <SelectItem value="size_asc">Size small→big</SelectItem>
            </SelectContent>
          </Select>
          <Select value={providerSort} onValueChange={(v) => setParam('providerSort', v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Sort Provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Newest first</SelectItem>
              <SelectItem value="created_asc">Oldest first</SelectItem>
              <SelectItem value="key_asc">Key A–Z</SelectItem>
              <SelectItem value="key_desc">Key Z–A</SelectItem>
              <SelectItem value="size_desc">Size big→small</SelectItem>
              <SelectItem value="size_asc">Size small→big</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchItems} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
          {(serviceRequestId || q) && (
            <Button variant="outline" onClick={() => { setParam('serviceRequestId',''); setParam('q','') }}>Clear</Button>
          )}
          {/* CSV export helpers: export currently loaded rows, no additional fetch */}
          <Button variant="outline" onClick={() => {
            try {
              const rows = (dbItems || []).map(it => ({
                source: 'db',
                id: it.id,
                key: it.key || '',
                name: it.name || '',
                url: it.url || '',
                size: typeof it.size === 'number' ? String(it.size) : '',
                contentType: it.contentType || '',
                avStatus: it.avStatus || '',
                uploadedAt: it.uploadedAt || '',
                serviceRequestId: it.serviceRequestId || ''
              }))
              const header = Object.keys(rows[0] || { source: '', id: '', key: '', name: '', url: '', size: '', contentType: '', avStatus: '', uploadedAt: '', serviceRequestId: '' })
              const csv = [header.join(','), ...rows.map(r => header.map(h => {
                const v = (r as any)[h]
                const s = v == null ? '' : String(v)
                const needsQuote = /[",\n]/.test(s)
                return needsQuote ? '"' + s.replace(/"/g, '""') + '"' : s
              }).join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `quarantine-db-${new Date().toISOString().slice(0,19)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            } catch {
              toast.error('Export failed')
            }
          }}>Export DB CSV</Button>
          <Button variant="outline" onClick={() => {
            try {
              const rows = (filteredProvider || []).map(it => ({
                source: 'provider',
                key: it.key,
                size: typeof it.size === 'number' ? String(it.size) : '',
                createdAt: it.createdAt || ''
              }))
              const header = Object.keys(rows[0] || { source: '', key: '', size: '', createdAt: '' })
              const csv = [header.join(','), ...rows.map(r => header.map(h => {
                const v = (r as any)[h]
                const s = v == null ? '' : String(v)
                const needsQuote = /[",\n]/.test(s)
                return needsQuote ? '"' + s.replace(/"/g, '""') + '"' : s
              }).join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `quarantine-provider-${new Date().toISOString().slice(0,19)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            } catch {
              toast.error('Export failed')
            }
          }}>Export Provider CSV</Button>
          {keysSelected.length > 0 && (
            <>
              <Button onClick={async () => {
                if (!confirm(`Release ${keysSelected.length} item(s)?`)) return
                const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'release', keys: keysSelected }) })
                if (!res.ok) { await toastFromResponse(res, { failure: 'Bulk release failed' }); return }
                toastSuccess('Bulk release initiated')
                fetchItems()
              }}>Bulk Release ({keysSelected.length})</Button>
              <Button variant="destructive" onClick={async () => {
                if (!confirm(`Delete ${keysSelected.length} item(s)?`)) return
                const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', keys: keysSelected }) })
                if (!res.ok) { await toastFromResponse(res, { failure: 'Bulk delete failed' }); return }
                toastSuccess('Bulk delete completed')
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Database Records</h2>
              {dbMeta ? <div className="text-sm text-gray-600">Total: {dbMeta.total}</div> : null}
            </div>
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
                <Pager meta={dbMeta} prefix="db" />
              </div>
            ) : (
              <Card><CardContent className="p-6 text-center">No matching DB records.</CardContent></Card>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Provider Blobs</h2>
              {providerMeta ? <div className="text-sm text-gray-600">Total: {providerMeta.total}</div> : null}
            </div>
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
                <Pager meta={providerMeta} prefix="provider" />
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
