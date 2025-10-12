'use client'

import React, { useEffect, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell, { SettingsSection } from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'

export default function SentryIntegrationPage() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [dsn, setDsn] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/integrations/sentry', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (mounted) {
            setEnabled(Boolean(json?.enabled))
            setDsn(json?.dsn || '')
          }
        }
      } catch (err:any) {
        if (mounted) setError(err?.message || 'Failed to load Sentry settings')
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  async function onSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/integrations/sentry', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, dsn }) })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
    } catch (err:any) {
      setError(err?.message || 'Unable to save Sentry settings')
    } finally { setSaving(false) }
  }

  return (
    <PermissionGate permission={PERMISSIONS.INTEGRATION_HUB_VIEW} fallback={<div className="p-6">You do not have access to Sentry integration settings.</div>}>
      <SettingsShell title="Sentry Integration" description="Manage Sentry error reporting and toggles for the application." loading={loading} saving={saving} errors={error ? [error] : undefined}>
        <div className="space-y-6">
          <SettingsSection title="Integration" description="Enable or disable Sentry error reporting and configure the DSN.">
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} />
                <span className="text-sm">Enabled</span>
              </label>

              <div>
                <label className="block text-sm text-gray-700">Sentry DSN</label>
                <input value={dsn} onChange={(e)=>setDsn(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded text-sm" placeholder="https://public@o0.ingest.sentry.io/0" />
                <p className="text-xs text-gray-500 mt-1">Keep DSN secure; prefer setting it as an environment variable for production.</p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">Save</button>
              </div>
            </div>
          </SettingsSection>
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
