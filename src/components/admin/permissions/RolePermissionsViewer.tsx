"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Shield, Copy, Loader2 } from 'lucide-react'

interface ApiResponse {
  success: boolean
  data?: {
    roles: string[]
    rolePermissions: Record<string, string[]>
  }
  error?: string
}

export default function RolePermissionsViewer() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/permissions/roles', { cache: 'no-store' })
        const json: ApiResponse = await res.json()
        if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Failed to load roles')
        if (!cancelled) {
          setRoles(json.data.roles)
          setRolePermissions(json.data.rolePermissions)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load role permissions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const maxPerms = useMemo(() => roles.reduce((m, r) => Math.max(m, rolePermissions[r]?.length || 0), 0), [roles, rolePermissions])

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rolePermissions, null, 2))
      alert('Copied role permissions JSON to clipboard')
    } catch {
      alert('Copy failed')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-800"><Shield className="h-4 w-4 text-blue-600" /><span className="font-medium">Role → Permissions</span></div>
        <button onClick={copyJson} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50">
          <Copy className="h-4 w-4" /> Copy JSON
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2 border-b font-medium">Role</th>
                <th className="px-3 py-2 border-b font-medium">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role} className="align-top">
                  <td className="px-3 py-2 border-b whitespace-nowrap text-gray-900 font-medium">{role}</td>
                  <td className="px-3 py-2 border-b">
                    <div className={`grid gap-1 ${maxPerms > 8 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {(rolePermissions[role] || []).map((p) => (
                        <span key={p} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded">{p}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
