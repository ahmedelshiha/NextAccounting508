'use client'

import React, { useEffect, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell, { SettingsSection } from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'

type AuditEntry = {
  id: string
  ts: string
  user: string | null
  action: string
  meta?: Record<string, any>
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/audit-logs?limit=50', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        const json = await res.json()
        if (mounted) setEntries(json || [])
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Unable to load audit logs')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <PermissionGate permission={PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Audit Logs.</div>}>
      <SettingsShell title="Audit Logs" description="Recent administrative and system audit events" loading={loading} errors={error ? [error] : undefined} maxWidth="xl">
        <div className="space-y-4">
          <SettingsSection title="Recent Events" description="Showing the latest 50 audit events.">
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-48">Timestamp</th>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 && !loading ? (
                    <tr><td colSpan={4} className="p-4 text-gray-600">No audit events found.</td></tr>
                  ) : entries.map(e => (
                    <tr key={e.id} className="border-t">
                      <td className="px-3 py-2 align-top font-mono text-xs text-gray-600">{new Date(e.ts).toLocaleString()}</td>
                      <td className="px-3 py-2 align-top">{e.user ?? 'System'}</td>
                      <td className="px-3 py-2 align-top">{e.action}</td>
                      <td className="px-3 py-2 align-top"><pre className="text-xs text-gray-700 whitespace-pre-wrap max-w-prose">{JSON.stringify(e.meta || {}, null, 2)}</pre></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SettingsSection>
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
