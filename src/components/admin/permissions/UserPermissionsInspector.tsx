"use client"

import React, { useState } from 'react'
import { Search, AlertTriangle } from 'lucide-react'

interface ApiResponse<T> { success?: boolean; data?: T; error?: string }
interface UserPerms { user: { id: string; role: string; name?: string | null; email?: string | null }; permissions: string[] }

export default function UserPermissionsInspector() {
  const [query, setQuery] = useState('me')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<UserPerms | null>(null)

  const onLookup = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/admin/permissions/${encodeURIComponent(query)}`)
      const json: ApiResponse<UserPerms> = await res.json()
      if (!res.ok || !json?.data) throw new Error(json.error || 'Lookup failed')
      setData(json.data)
    } catch (err: any) {
      setError(err?.message || 'Lookup failed')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <form onSubmit={onLookup} className="p-4 border-b border-gray-200 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={"Enter user id or &quot;me&quot;"} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <button type="submit" disabled={loading || !query} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{loading ? 'Loading…' : 'Inspect'}</button>
      </form>

      {error && (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</div>
      )}

      {data && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">User</div>
              <div className="font-medium text-gray-900">{data.user.name || data.user.email || data.user.id}</div>
              <div className="text-xs text-gray-500">Role: {data.user.role}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Effective Permissions</div>
            <div className="flex flex-wrap gap-1">
              {data.permissions.map((p) => (
                <span key={p} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">{p}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!data && !error && !loading && (
        <div className="p-4 text-sm text-gray-600">Enter a user ID or use &quot;me&quot; to inspect the current session&apos;s permissions.</div>
      )}
    </div>
  )
}
