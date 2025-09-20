"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, List, CalendarDays, BarChart3 } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ServiceRequestsOverview from '@/components/admin/service-requests/overview'
import ServiceRequestFilters, { type RequestFilters } from '@/components/admin/service-requests/filters'
import ServiceRequestsTable from '@/components/admin/service-requests/table'
import ServiceRequestsBulkActions from '@/components/admin/service-requests/bulk-actions'
import ServiceRequestsCalendarView from '@/components/admin/service-requests/calendar-view'
import { useRealtime } from '@/hooks/useRealtime'

export default function AdminServiceRequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const perms = usePermissions()
  const rt = useRealtime(['service-request-updated', 'team-assignment'])

  const [filters, setFilters] = useState<RequestFilters>({
    status: 'ALL',
    priority: 'ALL',
    bookingType: 'ALL',
    q: '',
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [typeTab, setTypeTab] = useState<'ALL' | 'REQUESTS' | 'APPOINTMENTS'>('ALL')
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR' | 'ANALYTICS'>('LIST')

  // Initialize filters/type/view from URL for deep linking
  useEffect(() => {
    if (!searchParams) return
    const get = (k: string) => searchParams.get(k) || ''
    const nextFilters = {
      status: (get('status') as any) || 'ALL',
      priority: (get('priority') as any) || 'ALL',
      bookingType: (get('bookingType') as any) || 'ALL',
      q: get('q') || '',
      dateFrom: get('dateFrom') || undefined,
      dateTo: get('dateTo') || undefined,
    } as RequestFilters
    setFilters(nextFilters)
    const t = get('type')
    if (t === 'appointments') setTypeTab('APPOINTMENTS')
    else if (t === 'requests') setTypeTab('REQUESTS')
    const v = get('view')
    if (v === 'calendar') setViewMode('CALENDAR')
    else if (v === 'analytics') setViewMode('ANALYTICS')
    const p = parseInt(get('page') || '1', 10)
    if (!Number.isNaN(p) && p > 0) setPage(p)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build URL query string (optional, useful for deep linking)
  const buildQuery = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (filters.q) params.set('q', filters.q)
    if (filters.status !== 'ALL') params.set('status', filters.status)
    if (filters.priority !== 'ALL') params.set('priority', filters.priority)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.bookingType && filters.bookingType !== 'ALL') params.set('bookingType', filters.bookingType)
    if (typeTab !== 'ALL') params.set('type', typeTab === 'APPOINTMENTS' ? 'appointments' : 'requests')
    return params.toString()
  }, [filters, page, limit, typeTab])

  const { items, pagination, isLoading, refresh } = useBookings({
    scope: 'admin',
    page,
    limit,
    q: filters.q,
    status: filters.status,
    priority: filters.priority,
    bookingType: filters.bookingType,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    type: typeTab === 'ALL' ? 'all' : typeTab === 'APPOINTMENTS' ? 'appointments' : 'requests',
  })

  // Reload function with refreshing state and selection reset
  const reload = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
      setSelected(new Set())
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  // Reset selection when items change
  useEffect(() => {
    setSelected(new Set())
  }, [items])

  // Realtime: refresh when updates occur
  useEffect(() => {
    if (!rt.events.length) return
    const lastEvent =
      rt.getLatestEvent('service-request-updated') || rt.getLatestEvent('team-assignment')
    if (lastEvent) void reload()
  }, [rt.events, rt.getLatestEvent, reload])

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(items.map(i => i.id)) : new Set())
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
              <ServiceRequestFilters
                value={filters}
                onChange={(v) => {
                  setFilters(v)
                  setPage(1)
                }}
                onRefresh={reload}
                refreshing={refreshing}
              />
              <div className="shrink-0">
                {perms.has(PERMISSIONS.SERVICE_REQUESTS_CREATE) && (
                  <Button
                    onClick={() => router.push('/admin/service-requests/new')}
                    className="flex items-center gap-2"
                  >
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
                    <TabsTrigger value="LIST" className="flex items-center gap-2">
                      <List className="h-4 w-4" /> List
                    </TabsTrigger>
                    <TabsTrigger value="CALENDAR" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" /> Calendar
                    </TabsTrigger>
                    <TabsTrigger value="ANALYTICS" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Analytics
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {isLoading ? (
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
                  <ServiceRequestsOverview />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <ServiceRequestsBulkActions selectedIds={[...selected]} onDone={reload} />
              <div className="text-sm text-gray-500">
                Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1} • Total{' '}
                {pagination?.total ?? items.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
