'use client'

import React, { useEffect, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell, { SettingsSection } from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'

export default function MFASettingsPage() {
  const [loading, setLoading] = useState(true)
  const [enabledForAdmins, setEnabledForAdmins] = useState<boolean>(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/security-settings', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (mounted) setEnabledForAdmins(Boolean(json?.twoFactor?.requiredForAdmins ?? true))
        }
      } catch (err:any) {
        if (mounted) setError(err?.message || 'Failed to fetch MFA settings')
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  async function onToggle(v: boolean) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/security-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ twoFactor: { requiredForAdmins: v } }) })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setEnabledForAdmins(v)
    } catch (err:any) {
      setError(err?.message || 'Unable to save MFA settings')
    } finally { setSaving(false) }
  }

  return (
    <PermissionGate permission={PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to MFA settings.</div>}>
      <SettingsShell title="Multi-factor Authentication (MFA)" description="Manage two-factor authentication requirements and enrollment options." loading={loading} saving={saving} errors={error ? [error] : undefined}>
        <div className="space-y-6">
          <SettingsSection title="Admin Enforcement" description="Require MFA for administrative users." >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-700">Require MFA for users with admin privileges.</p>
                <p className="text-xs text-gray-500 mt-1">Enabling this will require admins to enroll in a second factor during next sign-in.</p>
              </div>
              <div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={enabledForAdmins} onChange={(e)=>onToggle(e.target.checked)} disabled={saving} />
                  <span className="text-sm">Enforced</span>
                </label>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Enrollment & Recovery" description="Tools for managing user enrollment, backup codes, and recovery policies.">
            <div className="bg-white border rounded-lg p-4 text-sm text-gray-700">
              <p>Use the user management panel to view enrolled devices and generate recovery codes. Recovery codes can be rotated per-user from the user detail screen.</p>
            </div>
          </SettingsSection>
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
