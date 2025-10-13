'use client'

import React, { useEffect, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell, { SettingsSection } from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'

export default function RateLimitingPage() {
  const [loading, setLoading] = useState(true)
  const [limits, setLimits] = useState<{ key: string; perMinute: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/settings/rate-limits', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (mounted) setLimits(Array.isArray(json) ? json : [])
        }
      } catch (err:any) {
        if (mounted) setError(err?.message || 'Failed to load rate limits')
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  async function onSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings/rate-limits', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(limits) })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
    } catch (err:any) {
      setError(err?.message || 'Unable to save rate limits')
    } finally { setSaving(false) }
  }

  return (
    <PermissionGate permission={PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Rate Limiting configuration.</div>}>
      <SettingsShell title="Rate Limiting" description="Configure global rate limiting rules for API endpoints." loading={loading} saving={saving} errors={error ? [error] : undefined}>
        <div className="space-y-6">
          <SettingsSection title="Per-endpoint Rules" description="Define limits in requests per minute for critical endpoints.">
            <div className="bg-white border rounded-lg p-4 space-y-3">
              {limits.length === 0 && !loading ? (
                <div className="text-sm text-gray-600">No custom rules defined.</div>
              ) : limits.map((r, i) => (
                <div key={r.key} className="flex items-center gap-3">
                  <div className="w-64 text-sm font-mono text-gray-700">{r.key}</div>
                  <input type="number" value={r.perMinute} onChange={(e)=>{ const v = Number(e.target.value)||0; setLimits(prev => prev.map((p,idx)=> idx===i ? {...p, perMinute: v} : p)) }} className="px-2 py-1 border rounded text-sm w-28" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">Save</button>
            </div>
          </SettingsSection>
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
