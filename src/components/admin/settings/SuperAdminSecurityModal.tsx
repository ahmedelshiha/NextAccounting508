'use client'
import React, { useEffect, useState } from 'react'
import { Toggle, TextField, NumberField } from '@/components/admin/settings/FormField'
import AdminIpHelper from '@/components/admin/settings/AdminIpHelper'
import { useSession } from 'next-auth/react'

type Props = {
  open: boolean
  onClose: () => void
  onSaved?: (updated: any) => void
}

export default function SuperAdminSecurityModal({ open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [pending, setPending] = useState<any>({})
  const [otpNeeded, setOtpNeeded] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const { data: session } = useSession()
  const isSuper = (session?.user as any)?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (!open) return
    setLoading(true)
    ;(async () => {
      try {
        const r = await fetch('/api/admin/security-settings', { cache: 'no-store' })
        if (r.status === 401 && r.headers.get('x-step-up-required')) {
          setOtpNeeded(true)
          setLoading(false)
          return
        }
        if (r.ok) {
          const j = await r.json()
          setSettings(j)
        }
      } catch (e) {
        // ignore
      } finally { setLoading(false) }
    })()
  }, [open])

  function update(path: string, value: any) {
    setPending((p: any) => {
      const copy = { ...p }
      const [section, key] = path.split('.')
      copy[section] = { ...(copy[section] || {}), [key]: value }
      return copy
    })
  }

  async function save(withOtp?: string) {
    setSaving(true)
    setError('')
    try {
      const body = { ...pending }
      const headers: any = { 'Content-Type': 'application/json' }
      if (withOtp) headers['x-mfa-otp'] = withOtp
      const r = await fetch('/api/admin/security-settings', { method: 'PUT', headers, body: JSON.stringify(body) })
      if (r.status === 401 && r.headers.get('x-step-up-required')) {
        setOtpNeeded(true)
        return
      }
      if (r.ok) {
        const j = await r.json()
        setSettings(j)
        setPending({})
        if (onSaved) onSaved(j)
        onClose()
      } else {
        const json = await r.json().catch(() => null)
        setError((json && json.error) || 'Failed to save')
      }
    } catch (e) {
      setError('Failed to save')
    } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="modal-panel bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Super Admin Security Controls</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-600">Manage tenant-level overrides for Super Admin security. For operational guidance see the runbook and environment docs: <a href="/docs/runbooks/superadmin-stepup-runbook.md" className="text-blue-600 underline">Runbook</a> · <a href="/docs/ENVIRONMENT_VARIABLES_REFERENCE.md" className="text-blue-600 underline">ENV Vars</a></div>
          {loading && <div className="text-gray-600">Loading...</div>}
          {!loading && settings && (
            <>
              <section className="space-y-3">
                <h4 className="text-sm font-medium">Authentication & MFA</h4>
                <Toggle label="Require 2FA for Admins (tenant override)" value={pending.twoFactor?.requiredForAdmins ?? settings.twoFactor?.requiredForAdmins} onChange={(v)=>update('twoFactor.requiredForAdmins', v)} />
                {isSuper ? (
                  <Toggle label="Super Admin Step-up MFA (tenant override)" value={pending.superAdmin?.stepUpMfa ?? settings.superAdmin?.stepUpMfa} onChange={(v)=>update('superAdmin.stepUpMfa', v)} />
                ) : (
                  <div className="text-sm text-gray-600">Super Admin step-up controls are visible to SUPER_ADMIN users only.</div>
                )}
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-medium">Network & IP Controls</h4>
                <Toggle label="Enable IP Restrictions" value={pending.network?.enableIpRestrictions ?? settings.network?.enableIpRestrictions} onChange={(v)=>update('network.enableIpRestrictions', v)} />
                <TextField label="Admin IP Whitelist (comma-separated CIDR/addresses)" value={(pending.network?.ipAllowlist ?? (settings.network?.ipAllowlist || [])).join(', ')} onChange={(v)=>update('network.ipAllowlist', v.split(',').map((x:any)=>x.trim()).filter(Boolean))} />
                <TextField label="IP Blocklist (comma-separated)" value={(pending.network?.ipBlocklist ?? (settings.network?.ipBlocklist || [])).join(', ')} onChange={(v)=>update('network.ipBlocklist', v.split(',').map((x:any)=>x.trim()).filter(Boolean))} />
                <div className="pt-2">
                  <AdminIpHelper />
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-medium">Audit & Logging</h4>
                {isSuper ? (
                  <Toggle label="Log Admin Access" value={pending.superAdmin?.logAdminAccess ?? settings.superAdmin?.logAdminAccess} onChange={(v)=>update('superAdmin.logAdminAccess', v)} />
                ) : (
                  <div className="text-sm text-gray-600">Admin access logging toggle is visible to SUPER_ADMIN users only.</div>
                )}
                <NumberField label="Audit Log Retention (days)" value={pending.dataProtection?.auditLogRetentionDays ?? settings.dataProtection?.auditLogRetentionDays} onChange={(v)=>update('dataProtection.auditLogRetentionDays', v)} />
              </section>

              {otpNeeded && (
                <div className="p-3 border rounded-md bg-yellow-50">
                  <div className="text-sm">Step-up verification is required. Enter your 6-digit OTP to proceed.</div>
                  <div className="mt-2 flex gap-2">
                    <input maxLength={10} value={otp} onChange={(e)=>setOtp(e.target.value)} className="border p-2 rounded-md" />
                    <button onClick={()=>save(otp)} className="px-3 py-2 bg-blue-600 text-white rounded-md">Verify & Save</button>
                  </div>
                </div>
              )}

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="pt-4 flex items-center justify-end gap-2">
                <button onClick={onClose} className="px-3 py-2 bg-white border rounded-md">Cancel</button>
                <button disabled={saving} onClick={()=>save()} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </>
          )}

          {!loading && !settings && <div className="text-gray-600">Unable to load settings</div>}
        </div>
      </div>
    </div>
  )
}
