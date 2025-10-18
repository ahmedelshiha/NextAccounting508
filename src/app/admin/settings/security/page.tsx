"use client"

'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, Toggle, NumberField, SelectField } from '@/components/admin/settings/FormField'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

type SecuritySettings = {
  passwordPolicy: any
  sessionSecurity: any
  twoFactor: any
  network: any
  dataProtection: any
  compliance: any
}

const tabs = [
  { key: 'passwordPolicy', label: 'Password Policy' },
  { key: 'sessionSecurity', label: 'Session Security' },
  { key: 'twoFactor', label: 'Two-Factor Auth' },
  { key: 'network', label: 'Network Policies' },
  { key: 'dataProtection', label: 'Data Protection' },
  { key: 'compliance', label: 'Compliance' },
]

import SuperAdminSecurityModal from '@/components/admin/settings/SuperAdminSecurityModal'

export default function SecurityComplianceSettingsPage() {
  const [active, setActive] = useState<string>('passwordPolicy')
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [pending, setPending] = useState<Partial<SecuritySettings>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    let r = await fetch('/api/admin/security-settings', { cache: 'no-store' })
    if (r.status === 401 && r.headers.get('x-step-up-required')) {
      const code = typeof window !== 'undefined' ? window.prompt('Step-up verification required. Enter your 6-digit code:') : ''
      if (code) {
        r = await fetch('/api/admin/security-settings', { cache: 'no-store', headers: { 'x-mfa-otp': code } })
      }
    }
    if (r.ok) { const j = await r.json(); setSettings(j) }
  })() }, [])

  function onChange(section: keyof SecuritySettings, key: string, value: any) {
    setPending(p => ({ ...p, [section]: { ...(p as any)[section], [key]: value } }))
  }

  async function onSave() {
    if (!Object.keys(pending).length) return
    setSaving(true)
    try {
      let r = await fetch('/api/admin/security-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
      if (r.status === 401 && r.headers.get('x-step-up-required')) {
        const code = typeof window !== 'undefined' ? window.prompt('Enter your 6-digit code to save changes:') : ''
        if (code) {
          r = await fetch('/api/admin/security-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-mfa-otp': code }, body: JSON.stringify(pending) })
        }
      }
      if (r.ok) { const j = await r.json(); setSettings(j); setPending({}) }
    } finally { setSaving(false) }
  }

  const body = useMemo(() => {
    if (!settings) return <div className="text-gray-600">Loading...</div>
    switch (active) {
      case 'passwordPolicy': return (
        <section className="space-y-4">
          <NumberField label="Minimum Length" value={(pending.passwordPolicy as any)?.minLength ?? settings.passwordPolicy?.minLength ?? 12} onChange={(v)=>onChange('passwordPolicy','minLength',v)} />
          <Toggle label="Require Uppercase" value={(pending.passwordPolicy as any)?.requireUppercase ?? settings.passwordPolicy?.requireUppercase ?? true} onChange={(v)=>onChange('passwordPolicy','requireUppercase',v)} />
          <Toggle label="Require Lowercase" value={(pending.passwordPolicy as any)?.requireLowercase ?? settings.passwordPolicy?.requireLowercase ?? true} onChange={(v)=>onChange('passwordPolicy','requireLowercase',v)} />
          <Toggle label="Require Number" value={(pending.passwordPolicy as any)?.requireNumber ?? settings.passwordPolicy?.requireNumber ?? true} onChange={(v)=>onChange('passwordPolicy','requireNumber',v)} />
          <Toggle label="Require Symbol" value={(pending.passwordPolicy as any)?.requireSymbol ?? settings.passwordPolicy?.requireSymbol ?? false} onChange={(v)=>onChange('passwordPolicy','requireSymbol',v)} />
          <NumberField label="Rotation (days)" value={(pending.passwordPolicy as any)?.rotationDays ?? settings.passwordPolicy?.rotationDays ?? 0} onChange={(v)=>onChange('passwordPolicy','rotationDays',v)} />
        </section>
      )
      case 'sessionSecurity': return (
        <section className="space-y-4">
          <NumberField label="Session Timeout (min)" value={(pending.sessionSecurity as any)?.sessionTimeoutMinutes ?? settings.sessionSecurity?.sessionTimeoutMinutes ?? 60} onChange={(v)=>onChange('sessionSecurity','sessionTimeoutMinutes',v)} />
          <NumberField label="Idle Timeout (min)" value={(pending.sessionSecurity as any)?.idleTimeoutMinutes ?? settings.sessionSecurity?.idleTimeoutMinutes ?? 30} onChange={(v)=>onChange('sessionSecurity','idleTimeoutMinutes',v)} />
          <NumberField label="Max Concurrent Sessions" value={(pending.sessionSecurity as any)?.maxConcurrentSessions ?? settings.sessionSecurity?.maxConcurrentSessions ?? 5} onChange={(v)=>onChange('sessionSecurity','maxConcurrentSessions',v)} />
          <Toggle label="Enforce Single Session" value={(pending.sessionSecurity as any)?.enforceSingleSession ?? settings.sessionSecurity?.enforceSingleSession ?? false} onChange={(v)=>onChange('sessionSecurity','enforceSingleSession',v)} />
          <Toggle label="Refresh Token Rotation" value={(pending.sessionSecurity as any)?.refreshTokenRotation ?? settings.sessionSecurity?.refreshTokenRotation ?? true} onChange={(v)=>onChange('sessionSecurity','refreshTokenRotation',v)} />
        </section>
      )
      case 'twoFactor': return (
        <section className="space-y-4">
          <Toggle label="Require 2FA for Admins" value={(pending.twoFactor as any)?.requiredForAdmins ?? settings.twoFactor?.requiredForAdmins ?? true} onChange={(v)=>onChange('twoFactor','requiredForAdmins',v)} />
          <TextField label="Allowed Methods (comma-separated)" value={((pending.twoFactor as any)?.allowedMethods ?? settings.twoFactor?.allowedMethods ?? []).join(', ')} onChange={(v)=>onChange('twoFactor','allowedMethods', v.split(',').map(x=>x.trim()).filter(Boolean))} />
          <NumberField label="Backup Codes" value={(pending.twoFactor as any)?.backupCodes ?? settings.twoFactor?.backupCodes ?? 5} onChange={(v)=>onChange('twoFactor','backupCodes',v)} />
        </section>
      )
      case 'network': return (
        <section className="space-y-4">
          <TextField label="IP Allowlist (comma-separated)" value={((pending.network as any)?.ipAllowlist ?? settings.network?.ipAllowlist ?? []).join(', ')} onChange={(v)=>onChange('network','ipAllowlist', v.split(',').map(x=>x.trim()).filter(Boolean))} />
          <TextField label="IP Blocklist (comma-separated)" value={((pending.network as any)?.ipBlocklist ?? settings.network?.ipBlocklist ?? []).join(', ')} onChange={(v)=>onChange('network','ipBlocklist', v.split(',').map(x=>x.trim()).filter(Boolean))} />
          <Toggle label="Block Tor Exit Nodes" value={(pending.network as any)?.blockTorExitNodes ?? settings.network?.blockTorExitNodes ?? false} onChange={(v)=>onChange('network','blockTorExitNodes',v)} />
          <TextField label="Geo Restrictions (ISO codes, comma-separated)" value={((pending.network as any)?.geoRestrictions ?? settings.network?.geoRestrictions ?? []).join(', ')} onChange={(v)=>onChange('network','geoRestrictions', v.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean))} />
        </section>
      )
      case 'dataProtection': return (
        <section className="space-y-4">
          <NumberField label="Audit Log Retention (days)" value={(pending.dataProtection as any)?.auditLogRetentionDays ?? settings.dataProtection?.auditLogRetentionDays ?? 365} onChange={(v)=>onChange('dataProtection','auditLogRetentionDays',v)} />
          <Toggle label="PII Redaction Enabled" value={(pending.dataProtection as any)?.piiRedactionEnabled ?? settings.dataProtection?.piiRedactionEnabled ?? true} onChange={(v)=>onChange('dataProtection','piiRedactionEnabled',v)} />
          <Toggle label="Export Requests Enabled" value={(pending.dataProtection as any)?.exportRequestsEnabled ?? settings.dataProtection?.exportRequestsEnabled ?? true} onChange={(v)=>onChange('dataProtection','exportRequestsEnabled',v)} />
          <Toggle label="Legal Hold Enabled" value={(pending.dataProtection as any)?.legalHoldEnabled ?? settings.dataProtection?.legalHoldEnabled ?? false} onChange={(v)=>onChange('dataProtection','legalHoldEnabled',v)} />
          <NumberField label="Document Retention (days)" value={(pending.dataProtection as any)?.documentRetentionDays ?? settings.dataProtection?.documentRetentionDays ?? 730} onChange={(v)=>onChange('dataProtection','documentRetentionDays',v)} />
        </section>
      )
      case 'compliance': return (
        <section className="space-y-4">
          <Toggle label="GDPR Enabled" value={(pending.compliance as any)?.gdprEnabled ?? settings.compliance?.gdprEnabled ?? true} onChange={(v)=>onChange('compliance','gdprEnabled',v)} />
          <Toggle label="HIPAA Enabled" value={(pending.compliance as any)?.hipaaEnabled ?? settings.compliance?.hipaaEnabled ?? false} onChange={(v)=>onChange('compliance','hipaaEnabled',v)} />
          <Toggle label="SOC 2 Enabled" value={(pending.compliance as any)?.soc2Enabled ?? settings.compliance?.soc2Enabled ?? false} onChange={(v)=>onChange('compliance','soc2Enabled',v)} />
          <Toggle label="Require DPA" value={(pending.compliance as any)?.requireDpa ?? settings.compliance?.requireDpa ?? false} onChange={(v)=>onChange('compliance','requireDpa',v)} />
        </section>
      )
      default: return null
    }
  }, [active, pending, settings])

  const [openModal, setOpenModal] = useState(false)

  const { data: session } = useSession()
  const isSuper = (session?.user as any)?.role === 'SUPER_ADMIN'

  return (
    <PermissionGate permission={PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Security & Compliance Settings.</div>}>
      <SettingsShell title="Security & Compliance" description="Policies for authentication, sessions, network, data protection, and compliance" actions={(<div className="flex items-center gap-2"><PermissionGate permission={PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_EDIT}><button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Save Changes</button></PermissionGate><PermissionGate permission={PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_EDIT}>{isSuper ? <button onClick={()=>setOpenModal(true)} className="inline-flex items-center px-3 py-2 rounded-md text-sm text-gray-700 bg-gray-100 hover:bg-gray-200">Super Admin Controls</button> : <button disabled className="inline-flex items-center px-3 py-2 rounded-md text-sm text-gray-400 bg-gray-100" title="Super Admins only">Super Admin Controls</button>}</PermissionGate> <FavoriteToggle settingKey="securityCompliance" route="/admin/settings/security" label="Security & Compliance" /></div>)}>
        <div className="px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <aside className="lg:col-span-1">
                <nav className="bg-white border rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Security Settings</h3>
                  <ul className="space-y-1">
                    {tabs.map(t => (
                      <li key={t.key}>
                        <button onClick={()=>setActive(t.key)} className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm ${active===t.key? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <span>{t.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
              <section className="lg:col-span-4">
                <div className="bg-white border rounded-lg p-6">
                  {body}
                </div>
              </section>
            </div>
          </div>
        </div>
      </SettingsShell>
      <SuperAdminSecurityModal open={openModal} onClose={()=>setOpenModal(false)} onSaved={(s)=>{ setSettings(s); setPending({}) }} />
    </PermissionGate>
  )
}
