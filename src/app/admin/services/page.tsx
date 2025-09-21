"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { ServicesHeader } from '@/components/admin/services/ServicesHeader'
import { ServicesFilters } from '@/components/admin/services/ServicesFilters'
import { ServiceCard } from '@/components/admin/services/ServiceCard'
import { ServiceForm } from '@/components/admin/services/ServiceForm'
import { BulkActionsPanel } from '@/components/admin/services/BulkActionsPanel'
import { ServicesAnalytics } from '@/components/admin/services/ServicesAnalytics'
import { Modal } from '@/components/ui/Modal'
import { Service as ServiceType, ServiceFilters as ServiceFiltersType, BulkAction } from '@/types/services'

// Lightweight local helpers
function toServiceType(raw: any): ServiceType {
  return {
    id: String(raw.id || raw.id ?? ''),
    slug: String(raw.slug || ''),
    name: String(raw.name || ''),
    description: String(raw.description || ''),
    shortDesc: raw.shortDesc ?? null,
    features: Array.isArray(raw.features) ? raw.features : [],
    price: typeof raw.price === 'number' ? raw.price : raw.price ? Number(raw.price) : undefined,
    duration: typeof raw.duration === 'number' ? raw.duration : raw.duration ? Number(raw.duration) : undefined,
    category: raw.category ?? null,
    featured: !!raw.featured,
    active: raw.active === undefined ? true : !!raw.active,
    image: raw.image ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export default function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(false)

  // Filters state shaped for ServicesFilters
  const [filters, setFilters] = useState<ServiceFiltersType>({ search: '', category: 'all', featured: 'all', status: 'all' })

  // Selection / bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Create / edit
  const [editing, setEditing] = useState<ServiceType | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Analytics
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 20

  const load = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true)
      const qp = new URLSearchParams()
      if (filters.featured === 'featured') qp.set('featured', 'true')
      if (filters.status === 'active') qp.set('active', 'true')
      if (filters.status === 'inactive') qp.set('active', 'false')
      if (filters.search) qp.set('search', filters.search)
      if (filters.category && filters.category !== 'all') qp.set('category', filters.category)
      const res = await apiFetch(`/api/admin/services${qp.toString() ? `?${qp.toString()}` : ''}`)
      if (!res.ok) throw new Error('Failed to load services')
      const json = await res.json()
      const list = Array.isArray(json) ? json.map(toServiceType) : []
      setServices(list)
    } catch (e) {
      console.error('load services', e)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      // Attempt admin stats endpoint; fallback to analytics endpoint
      let res = await apiFetch('/api/admin/services/stats')
      if (!res.ok) res = await apiFetch('/api/admin/analytics')
      if (!res.ok) { setAnalytics(null); return }
      const json = await res.json()
      // Normalize to shape expected by ServicesAnalytics component
      const normalized = {
        monthlyBookings: Array.isArray(json.monthlyBookings) ? json.monthlyBookings : (Array.isArray(json.dailyBookings) ? json.dailyBookings.map((d:any, i:number) => ({ month: d.label || d.date || `#${i}`, bookings: typeof d.count === 'number' ? d.count : Number(d.count)||0 })) : []),
        revenueByService: Array.isArray(json.revenueByService) ? json.revenueByService.map((r:any) => ({ service: r.service || r.label || 'Unknown', revenue: r.amount ?? r.revenue ?? 0 })) : [],
        popularServices: Array.isArray(json.topServices) ? json.topServices.map((t:any) => ({ service: t.service, bookings: t.bookings })) : [],
        conversionRates: Array.isArray(json.conversionRates) ? json.conversionRates : [],
      }
      setAnalytics(normalized)
    } catch (e) {
      console.error('load analytics', e)
      setAnalytics(null)
    } finally { setAnalyticsLoading(false) }
  }, [])

  useEffect(() => { load(true) }, [load])
  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const stats = useMemo(() => {
    const total = services.length
    const active = services.filter(s => s.active).length
    const featured = services.filter(s => s.featured).length
    const categories = new Set(services.filter(s => s.category).map(s => s.category)).size
    const priced = services.filter(s => typeof s.price === 'number')
    const avgPrice = priced.length ? priced.reduce((a,s) => a + Number(s.price || 0), 0) / priced.length : 0
    const totalRevenue = 0
    return { total, active, featured, categories, averagePrice: avgPrice, totalRevenue }
  }, [services])

  const onSearchChange = (value: string) => setFilters(prev => ({ ...prev, search: value }))
  const onRefresh = () => load()
  const onExport = async () => {
    try {
      const res = await apiFetch('/api/admin/services/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'services-export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch (e) { console.error(e); toast.error('Export failed') }
  }
  const [showModal, setShowModal] = useState(false)
  const onCreateNew = () => { setEditing(null); setShowModal(true) }

  // Filters component change
  const onFiltersChange = (f: ServiceFiltersType) => setFilters(f)

  // Selection helpers
  const toggleSelect = (id: string, checked: boolean) => setSelectedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next })
  const clearSelection = () => setSelectedIds(new Set())

  // CRUD
  const handleCreate = async (data: any) => {
    try {
      setFormLoading(true)
      const body = { ...data }
      const res = await apiFetch('/api/admin/services', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Create failed')
      toast.success('Service created')
      setShowModal(false)
      await load()
    } catch (e) {
      console.error('create', e)
      toast.error('Failed to create')
    } finally { setFormLoading(false) }
  }

  const handleUpdate = async (data: any) => {
    if (!editing) return
    try {
      setFormLoading(true)
      const res = await apiFetch(`/api/admin/services/${encodeURIComponent(editing.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Service updated')
      setEditing(null)
      setShowModal(false)
      await load()
    } catch (e) {
      console.error('update', e)
      toast.error('Failed to update')
    } finally { setFormLoading(false) }
  }

  const handleDelete = async (service: ServiceType) => {
    if (!confirm('Delete this service?')) return
    try {
      const res = await apiFetch(`/api/admin/services/${encodeURIComponent(service.slug)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Service deleted')
      await load()
    } catch (e) { console.error('delete', e); toast.error('Failed to delete') }
  }

  const handleDuplicate = async (service: ServiceType) => {
    try {
      const base = `${service.slug}-copy-${Date.now()}`
      const body = { ...service, name: `${service.name} (Copy)`, slug: base }
      const res = await apiFetch('/api/admin/services', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Duplicate failed')
      toast.success('Service duplicated')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to duplicate') }
  }

  const handleToggleActive = async (service: ServiceType) => {
    try {
      const res = await apiFetch(`/api/admin/services/${encodeURIComponent(service.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active: !service.active }) })
      if (!res.ok) throw new Error('Toggle failed')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to toggle') }
  }

  const handleToggleFeatured = async (service: ServiceType) => {
    try {
      const res = await apiFetch(`/api/admin/services/${encodeURIComponent(service.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ featured: !service.featured }) })
      if (!res.ok) throw new Error('Toggle failed')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to toggle') }
  }

  const onBulkAction = async (action: BulkAction) => {
    try {
      // action.action, serviceIds, value
      if (!action || !action.serviceIds || action.serviceIds.length === 0) return
      if (action.action === 'delete') {
        if (!confirm(`Delete ${action.serviceIds.length} services?`)) return
        await Promise.all(action.serviceIds.map(id => {
          const s = services.find(x => x.id === id)
          if (!s) return Promise.resolve(null)
          return apiFetch(`/api/admin/services/${encodeURIComponent(s.slug)}`, { method: 'DELETE' })
        }))
      } else if (action.action === 'activate' || action.action === 'deactivate') {
        const active = action.action === 'activate'
        await Promise.all(action.serviceIds.map(id => {
          const s = services.find(x => x.id === id); if (!s) return Promise.resolve(null)
          return apiFetch(`/api/admin/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active }) })
        }))
      } else if (action.action === 'feature' || action.action === 'unfeature') {
        const featured = action.action === 'feature'
        await Promise.all(action.serviceIds.map(id => {
          const s = services.find(x => x.id === id); if (!s) return Promise.resolve(null)
          return apiFetch(`/api/admin/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ featured }) })
        }))
      } else if (action.action === 'category' && typeof action.value === 'string') {
        await Promise.all(action.serviceIds.map(id => {
          const s = services.find(x => x.id === id); if (!s) return Promise.resolve(null)
          return apiFetch(`/api/admin/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ category: action.value }) })
        }))
      } else if (action.action === 'price-update' && typeof action.value === 'number') {
        await Promise.all(action.serviceIds.map(id => {
          const s = services.find(x => x.id === id); if (!s) return Promise.resolve(null)
          return apiFetch(`/api/admin/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ price: action.value }) })
        }))
      }
      toast.success('Bulk action completed')
      clearSelection()
      await load()
    } catch (e) { console.error('bulk', e); toast.error('Bulk action failed') }
  }

  // Derived lists
  const categories = useMemo(() => Array.from(new Set(services.filter(s => s.category).map(s => s.category as string))), [services])

  // Client-side filtering
  const filtered = useMemo(() => {
    return services.filter(s => {
      if (filters.status === 'active' && !s.active) return false
      if (filters.status === 'inactive' && s.active) return false
      if (filters.featured === 'featured' && !s.featured) return false
      if (filters.featured === 'non-featured' && s.featured) return false
      if (filters.category !== 'all' && s.category !== filters.category) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.slug.toLowerCase().includes(q) && !(s.shortDesc || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [services, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])
  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ServicesHeader stats={stats} searchTerm={filters.search} onSearchChange={onSearchChange} onRefresh={onRefresh} onExport={onExport} onCreateNew={onCreateNew} loading={loading} />

        <div className="mt-6 flex items-start gap-4">
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <ServicesFilters filters={filters} onFiltersChange={onFiltersChange} categories={categories} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paginated.map(s => (
                <ServiceCard key={s.id}
                  service={s}
                  isSelected={selectedIds.has(s.id)}
                  onSelect={(checked) => toggleSelect(s.id, checked)}
                  onEdit={(svc) => { setEditing(svc); setShowModal(true) }}
                  onDuplicate={(svc) => handleDuplicate(svc)}
                  onDelete={(svc) => handleDelete(svc)}
                  onToggleActive={(svc) => handleToggleActive(svc)}
                  onToggleFeatured={(svc) => handleToggleFeatured(svc)}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
                <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            </div>
          </div>

          <div style={{ minWidth: 360 }}>
            <div className="mb-4">
              <BulkActionsPanel selectedIds={Array.from(selectedIds)} onClearSelection={clearSelection} onBulkAction={onBulkAction} categories={categories} loading={loading} />
            </div>

            <div>
              {/* Render modal-based form for create/edit */}
              <ServicesAnalytics analytics={analytics} loading={analyticsLoading} />
            </div>

            {/* Modal for create/edit */}
            {typeof window !== 'undefined' && (
              // import modal lazily via client component above
              <React.Fragment>
                <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null) }} title={editing ? `Edit: ${editing.name}` : 'Create Service'}>
                  <ServiceForm initialData={editing ?? null} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => { setShowModal(false); setEditing(null) }} loading={formLoading} categories={categories} />
                </Modal>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
