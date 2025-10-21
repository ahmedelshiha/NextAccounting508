'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActivityRow {
  id: string
  action: string
  resource: string | null
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface PaginationResponse {
  data: ActivityRow[]
  total: number
  page: number
  pageSize: number
  pages: number
  error?: string
}

const PAGE_SIZE = 20

export default function AccountActivity() {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchActivity = async (pageNum: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/audit-logs?page=${pageNum}&pageSize=${PAGE_SIZE}`, { cache: 'no-store' })
      const json: PaginationResponse = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load activity')
      setRows(Array.isArray(json?.data) ? json.data : [])
      setTotal(json?.total || 0)
      setTotalPages(json?.pages || 1)
      setPage(pageNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity(1)
  }, [])

  const handlePrevPage = () => {
    if (page > 1) fetchActivity(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages) fetchActivity(page + 1)
  }

  if (loading && rows.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-600">Loading activity…</div>
    )
  }

  if (error && rows.length === 0) {
    return (
      <div className="mt-4 text-sm text-red-600">
        {error}
        <button onClick={() => fetchActivity(1)} className="ml-2 underline hover:no-underline">
          Retry
        </button>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="mt-4 text-sm text-gray-600">No recent activity</div>
    )
  }

  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-gray-800 mb-2">Recent account activity</div>
      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
        {rows.map(r => (
          <li key={r.id} className="px-3 py-2 text-sm text-gray-700 flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <div className="truncate"><span className="font-medium text-gray-900">{r.action}</span>{r.resource ? ` · ${r.resource}` : ''}</div>
              <div className="text-xs text-gray-500 truncate">
                {r.ipAddress ? `IP ${r.ipAddress}` : 'IP n/a'} · {r.userAgent ? r.userAgent.split(')')[0] + ')' : 'UA n/a'}
              </div>
            </div>
            <div className="text-xs text-gray-500 shrink-0">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</div>
          </li>
        ))}
      </ul>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Page {page} of {totalPages} ({total} total activities)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page <= 1 || loading}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages || loading}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
