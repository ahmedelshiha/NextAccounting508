'use client'
import React, { useEffect, useState } from 'react'

export default function AdminIpHelper() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/tools/client-ip', { cache: 'no-store' })
        if (!r.ok) { setData({ error: 'Failed to fetch' }); return }
        const j = await r.json()
        if (mounted) setData(j)
      } catch (e) {
        if (mounted) setData({ error: 'Fetch error' })
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="text-sm text-gray-600">Checking client IP...</div>
  if (!data) return <div className="text-sm text-gray-600">No data</div>
  if (data.error) return <div className="text-sm text-red-600">{data.error}</div>

  return (
    <div className="p-3 border rounded-md bg-gray-50">
      <div className="text-sm text-gray-700">Your IP: <span className="font-mono">{data.ip}</span> (<span className="uppercase">{data.family}</span>)</div>
      <div className="text-sm mt-1">Allowlist match: {data.allowed ? <span className="text-green-600 font-medium">Allowed</span> : <span className="text-red-600 font-medium">Not Allowed</span>}</div>
      {data.matched && <div className="text-xs text-gray-600 mt-1">Matched rule: <span className="font-mono">{data.matched}</span></div>}
    </div>
  )
}
