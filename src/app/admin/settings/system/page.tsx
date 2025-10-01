"use client"

import React, { useEffect, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { Toggle, NumberField, TextField } from '@/components/admin/settings/FormField'

interface SystemState {
  maintenanceMode: boolean
  readOnlyMode: boolean
  featureFlags: Record<string, boolean>
  backup: { enabled: boolean; retentionDays: number }
  impersonation: { enabled: boolean; allowedRoles: string[] }
  session: { maxSessionMinutes: number; singleSession: boolean }
}

export default function SystemAdministrationPage() {
  const [state, setState] = useState<SystemState>({
    maintenanceMode: false,
    readOnlyMode: false,
    featureFlags: {},
    backup: { enabled: false, retentionDays: 30 },
    impersonation: { enabled: false, allowedRoles: ['ADMIN'] },
    session: { maxSessionMinutes: 1440, singleSession: false },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/admin/system-settings', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (mounted) setState(j)
        }
      } finally { setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  async function save() {
    setSaving(true); setSaved(false)
    try {
      const r = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (r.ok) setSaved(true)
    } finally { setSaving(false) }
  }

  return (
    <PermissionGate permission={[PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to System Administration.</div>}>
      <SettingsShell
        title="System Administration"
        description="Global runtime controls, maintenance, and platform safeguards"
        loading={loading}
        saving={saving}
        saved={saved}
        actions={
          <PermissionGate permission={[PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT]}>
            <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save</button>
          </PermissionGate>
        }
      >
        <div className="space-y-8">
          {/* Platform Health Widgets moved here from Settings landing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database</CardTitle>
                <CardDescription>Connection status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">NETLIFY_DATABASE_URL</div>
                  <Badge className={Boolean(process.env.NETLIFY_DATABASE_URL) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {Boolean(process.env.NETLIFY_DATABASE_URL) ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>NextAuth configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">NEXTAUTH_URL</div>
                    <Badge className={process.env.NEXTAUTH_URL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {process.env.NEXTAUTH_URL ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">NEXTAUTH_SECRET</div>
                    <Badge className={process.env.NEXTAUTH_SECRET ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {process.env.NEXTAUTH_SECRET ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Environment</CardTitle>
              <CardDescription>Runtime flags and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>NODE_ENV</span>
                  <span className="font-medium">{process.env.NODE_ENV || 'development'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database configured</span>
                  <span className="font-medium">{Boolean(process.env.NETLIFY_DATABASE_URL) ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing System sections */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Runtime Modes</h2>
            <div className="grid gap-4">
              <Toggle label="Maintenance mode" value={state.maintenanceMode} onChange={(v)=>setState(s=>({ ...s, maintenanceMode: v }))} />
              <Toggle label="Read-only mode" value={state.readOnlyMode} onChange={(v)=>setState(s=>({ ...s, readOnlyMode: v }))} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Backups</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle label="Enable backups" value={state.backup.enabled} onChange={(v)=>setState(s=>({ ...s, backup: { ...s.backup, enabled: v } }))} />
              <NumberField label="Retention (days)" value={state.backup.retentionDays} onChange={(v)=>setState(s=>({ ...s, backup: { ...s.backup, retentionDays: Number(v||0) } }))} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Impersonation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle label="Allow user impersonation" value={state.impersonation.enabled} onChange={(v)=>setState(s=>({ ...s, impersonation: { ...s.impersonation, enabled: v } }))} />
              <TextField label="Allowed roles (comma-separated)" value={state.impersonation.allowedRoles.join(',')} onChange={(v)=>setState(s=>({ ...s, impersonation: { ...s.impersonation, allowedRoles: v.split(',').map(x=>x.trim()).filter(Boolean) } }))} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Sessions</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Max session minutes" value={state.session.maxSessionMinutes} onChange={(v)=>setState(s=>({ ...s, session: { ...s.session, maxSessionMinutes: Number(v||0) } }))} />
              <Toggle label="Single session per user" value={state.session.singleSession} onChange={(v)=>setState(s=>({ ...s, session: { ...s.session, singleSession: v } }))} />
            </div>
          </section>
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
