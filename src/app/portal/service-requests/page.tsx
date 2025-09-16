'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, ClipboardList, ChevronRight, Filter as FilterIcon, RefreshCw, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'

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

const DEFAULT_LIMIT = 10

export default function PortalServiceRequestsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & pagination
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const debouncedQ = useDebouncedValue(q, 300)

  const buildQuery = () => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (debouncedQ.trim()) params.set('q', debouncedQ.trim())
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)
    return params.toString()
  }

  const load = async () => {
    try {
      setLoading(true)
      const qs = buildQuery()
      const res = await apiFetch(`/api/portal/service-requests${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      const list = Array.isArray(json.data) ? json.data : []
      const metaPages = json?.meta?.pagination?.totalPages ?? 1
      setItems(list)
      setTotalPages(Math.max(1, parseInt(String(metaPages), 10) || 1))
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  useEffect(() => {
    if (!session) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, page, limit, debouncedQ, status, priority])

  // Realtime updates: re-fetch on server events
  useEffect(() => {
    if (!session) return
    let es: EventSource | null = null
    let retry = 0
    const connect = () => {
      es = new EventSource('/api/portal/realtime?events=service-request-updated')
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data)
          if (evt?.type === 'service-request-updated') {
            refresh()
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const canPrev = page > 1
  const canNext = page < totalPages

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
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button asChild>
              <Link href="/portal/service-requests/new">
                <Plus className="h-4 w-4 mr-2" /> New Request
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-sm">Filters</CardTitle>
              <CardDescription className="text-xs">Search and narrow down your requests</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by title or description"
                  value={q}
                  onChange={(e) => { setPage(1); setQ(e.target.value) }}
                />
              </div>
              <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Status: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={(v) => { setPage(1); setPriority(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching service requests</h3>
              <p className="text-gray-600 mb-4">Try adjusting filters or create a new request.</p>
              <Button asChild>
                <Link href="/portal/service-requests/new">Create Request</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((r) => (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {r.title}
                          </h3>
                          <Badge className={priorityStyles[r.priority] || 'bg-gray-100 text-gray-800'}>
                            {r.priority}
                          </Badge>
                          <Badge className={statusStyles[r.status] || 'bg-gray-100 text-gray-800'}>
                            {r.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {r.service?.name}
                        </p>
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canPrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!canNext}>
                  Next <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  const timeoutRef = useRef<any>(null)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setDebounced(value), delay)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [value, delay])
  return debounced
}
