import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityRow {
  id: string
  action: string
  resource: string | null
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function AccountActivity() {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/user/audit-logs', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load activity')
        if (mounted) setRows(Array.isArray(json?.data) ? json.data : [])
      } catch (e) {
        // best-effort: ignore
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="mt-4 text-sm text-gray-600">Loading activity…</div>
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
    </div>
  )
}
