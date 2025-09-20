"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, List, CalendarDays, BarChart3 } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ServiceRequestsOverview from '@/components/admin/service-requests/overview'
import ServiceRequestFilters, { type RequestFilters } from '@/components/admin/service-requests/filters'
import ServiceRequestsTable, { type ServiceRequestItem } from '@/components/admin/service-requests/table'
import ServiceRequestsBulkActions from '@/components/admin/service-requests/bulk-actions'
import ServiceRequestsCalendarView from '@/components/admin/service-requests/calendar-view'
import { useRealtime } from '@/hooks/useRealtime'

interface ListResponse {
  success?: boolean
  data?: ServiceRequestItem[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
  error?: string
}

export default function AdminServiceRequestsPage() {
  const router = useRouter()
  const perms = usePermissions()
  const rt = useRealtime(['service-request-updated','team-assignment'])

  const [filters, setFilters] = useState<RequestFilters>({ status: 'ALL', priority: 'ALL', q: '' })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [items, setItems] = useState<ServiceRequestItem[]>([])
  const [pagination, setPagination] = useState<ListResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [typeTab, setTypeTab] = useState<'ALL' | 'REQUESTS' | 'APPOINTMENTS'>('ALL')
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR' | 'ANALYTICS'>('LIST')

  const buildQuery = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (filters.q) params.set('q', filters.q)
    if (filters.status !== 'ALL') params.set('status', filters.status)
    if (filters.priority !== 'ALL') params.set('priority', filters.priority)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (typeTab !== 'ALL') params.set('type', typeTab === 'APPOINTMENTS' ? 'appointments' : 'requests')
    return params.toString()
  }, [filters, page, limit, typeTab])

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await apiFetch(`/api/admin/service-requests?${buildQuery}`)
      const j = await res.json().catch(() => ({})) as ListResponse
      setItems(Array.isArray(j.data) ? j.data : [])
      setPagination(j.pagination || null)
      setSelected(new Set())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [buildQuery])

  useEffect(() => { void load() }, [load])

  // Realtime: refresh when updates come in
  useEffect(() => {
    if (!rt.events.length) return
    const last = rt.getLatestEvent('service-request-updated') || rt.getLatestEvent('team-assignment')
    if (last) void load()
  }, [rt.events, rt.getLatestEvent, load])

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(items.map(i => i.id)) : new Set())
  }
  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <ServiceRequestsOverview />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <ServiceRequestFilters value={filters} onChange={(v) => { setFilters(v); setPage(1) }} onRefresh={load} refreshing={refreshing} />
              <div className="shrink-0">
                {perms.has(PERMISSIONS.SERVICE_REQUESTS_CREATE) && (
                  <Button onClick={() => router.push('/admin/service-requests/new')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Request
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Tabs value={typeTab} onValueChange={(v) => { setTypeTab(v as any); setPage(1) }}>
                  <TabsList>
                    <TabsTrigger value="ALL">All</TabsTrigger>
                    <TabsTrigger value="REQUESTS">Requests</TabsTrigger>
                    <TabsTrigger value="APPOINTMENTS">Appointments</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="LIST" className="flex items-center gap-2"><List className="h-4 w-4" /> List</TabsTrigger>
                    <TabsTrigger value="CALENDAR" className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Calendar</TabsTrigger>
                    <TabsTrigger value="ANALYTICS" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {loading ? (
                <div className="text-center text-gray-400 py-12">Loading…</div>
              ) : viewMode === 'LIST' ? (
                <ServiceRequestsTable
                  items={items}
                  selectedIds={selected}
                  onToggle={toggle}
                  onToggleAll={toggleAll}
                  onOpen={(id) => router.push(`/admin/service-requests/${id}`)}
                />
              ) : viewMode === 'CALENDAR' ? (
                <ServiceRequestsCalendarView
                  items={items}
                  onOpen={(id) => router.push(`/admin/service-requests/${id}`)}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Reuse overview charts inside analytics view for now */}
                  {/* The top-level overview remains visible above; this section focuses analytics content here as well */}
                  <ServiceRequestsOverview />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <ServiceRequestsBulkActions selectedIds={[...selected]} onDone={load} />
              <div className="text-sm text-gray-500">
                Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1} • Total {pagination?.total ?? items.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
