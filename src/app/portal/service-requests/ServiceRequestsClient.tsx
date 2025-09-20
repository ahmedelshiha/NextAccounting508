"use client"

// Client-only implementation of the Portal Service Requests list.
// Separated from the server page so hooks like useSearchParams are inside a Suspense boundary per Next.js 15 requirements.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ClipboardList, ChevronRight } from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ServiceSummary { id: string; name: string; slug: string; category?: string | null }
interface ServiceRequest {
  id: string
  title: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  service: ServiceSummary
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const priorityStyles: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-gray-100 text-gray-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export default function ServiceRequestsClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [bookingType, setBookingType] = useState<'ALL'|'STANDARD'|'RECURRING'|'EMERGENCY'|'CONSULTATION'>(
    (searchParams.get('bookingType') as any) || 'ALL'
  )
  const [typeTab, setTypeTab] = useState<'all'|'requests'|'appointments'>(
    (searchParams.get('type') as any) === 'requests' ? 'requests' : (searchParams.get('type') as any) === 'appointments' ? 'appointments' : 'all'
  )
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '')
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '')
  const [q, setQ] = useState<string>(searchParams.get('q') || '')
  const [debouncedQ, setDebouncedQ] = useState<string>(q)
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10) || 1)
  const [limit, setLimit] = useState<number>(parseInt(searchParams.get('limit') || '10', 10) || 10)

  // Debounce search input to reduce network churn
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // Keep URL in sync with filters/pagination
  useEffect(() => {
    const params = new URLSearchParams()
    if (status && status !== 'ALL') params.set('status', status)
    if (bookingType && bookingType !== 'ALL') params.set('bookingType', bookingType)
    if (typeTab && typeTab !== 'all') params.set('type', typeTab)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (debouncedQ) params.set('q', debouncedQ)
    params.set('page', String(page))
    params.set('limit', String(limit))
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }, [status, bookingType, dateFrom, dateTo, debouncedQ, page, limit, router])

  // Reset to first page on filter changes
  useEffect(() => { setPage(1) }, [status, bookingType, typeTab, dateFrom, dateTo, debouncedQ, limit])

  // Data via shared hook (SWR + unified SR API); scope=portal ensures client-specific data
  const { items, pagination, isLoading, refresh } = useBookings({
    scope: 'portal',
    page,
    limit,
    q: debouncedQ,
    status,
    bookingType,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    type: typeTab,
  })

  const totalPages = pagination?.totalPages || 1
  const total = pagination?.total || (Array.isArray(items) ? items.length : 0)

  // Realtime auto-refresh on SR updates
  useEffect(() => {
    if (!session) return
    let es: EventSource | null = null
    let retry = 0
    const connect = () => {
      es = new EventSource('/api/portal/realtime?events=service-request-updated')
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data)
          if (evt?.type === 'service-request-updated') refresh()
        } catch {}
      }
      es.onerror = () => {
        try { es?.close() } catch {}
        es = null
        const timeout = Math.min(30000, 1000 * Math.pow(2, retry++))
        setTimeout(connect, timeout)
      }
    }
    connect()
    return () => { try { es?.close() } catch {} }
  }, [session, refresh])

  const exportCSV = async () => {
    if (!Array.isArray(items) || !items.length) return
    const params = new URLSearchParams()
    if (status && status !== 'ALL') params.set('status', status)
    if (debouncedQ) params.set('q', debouncedQ)
    try {
      const res = await fetch(`/api/portal/service-requests/export${params.toString() ? `?${params}` : ''}` as string, { cache: 'no-store' })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `service-requests-${new Date().toISOString().slice(0,10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        return
      }
    } catch {}
    const rows = (items as ServiceRequest[]).map((r) => ({
      id: r.id,
      title: r.title,
      service: r.service?.name,
      priority: r.priority,
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
    }))
    const header = Object.keys(rows[0]).join(',')
    const csv = [header, ...rows.map((row) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-requests-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
          ))}
        </div>
      )
    }
    if (!items?.length) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests yet</h3>
            <p className="text-gray-600 mb-4">Create your first request to get started.</p>
            <Button asChild>
              <Link href="/portal/service-requests/new">Create Request</Link>
            </Button>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-3">
        {(items as ServiceRequest[]).map((r) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                    <Badge className={priorityStyles[r.priority] || 'bg-gray-100 text-gray-800'}>
                      {r.priority}
                    </Badge>
                    <Badge className={statusStyles[r.status] || 'bg-gray-100 text-gray-800'}>
                      {r.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{r.service?.name}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/portal/service-requests/${r.id}`}>
                    View <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [isLoading, items])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
              <p className="text-gray-600">Track your service requests and their status.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
            <Button asChild>
              <Link href="/portal/service-requests/new">
                <Plus className="h-4 w-4 mr-2" /> New Request
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Tabs value={typeTab} onValueChange={(v) => setTypeTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests..."
              className="w-64"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bookingType} onValueChange={(v) => setBookingType(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All booking types</SelectItem>
                <SelectItem value="STANDARD">STANDARD</SelectItem>
                <SelectItem value="RECURRING">RECURRING</SelectItem>
                <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
                <SelectItem value="CONSULTATION">CONSULTATION</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600" htmlFor="from">From</label>
              <Input id="from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600" htmlFor="to">To</label>
              <Input id="to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
            </div>
            <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v, 10) || 10)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(q || (status && status !== 'ALL') || (bookingType && bookingType !== 'ALL') || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setQ(''); setStatus('ALL'); setBookingType('ALL'); setDateFrom(''); setDateTo('') }}
              className="text-sm text-gray-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {content}

        {Array.isArray(items) && items.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}{total ? ` • ${total} total` : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
