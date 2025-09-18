'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ClipboardList, ChevronRight } from 'lucide-react'

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

export default function PortalServiceRequestsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)

  const exportCSV = () => {
    if (!items.length) return
    const rows = items.map((r) => ({
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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await apiFetch('/api/portal/service-requests')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setItems(Array.isArray(json.data) ? json.data : [])
      } finally {
        setLoading(false)
      }
    }
    if (!session) return
    load()

    let es: EventSource | null = null
    let retry = 0
    const connect = () => {
      es = new EventSource('/api/portal/realtime?events=service-request-updated')
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data)
          if (evt?.type === 'service-request-updated') {
            load()
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
  }, [session])

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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests yet</h3>
              <p className="text-gray-600 mb-4">Create your first request to get started.</p>
              <Button asChild>
                <Link href="/portal/service-requests/new">Create Request</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>
    </div>
  )
}
