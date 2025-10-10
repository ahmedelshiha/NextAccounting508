'use client'

import React, { useState, useCallback, lazy, Suspense } from 'react'
import SettingsShell, { SettingsCard, SettingsSection } from '@/components/admin/settings/SettingsShell'
import SettingsNavigation from '@/components/admin/settings/SettingsNavigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { runDiagnostics, exportSettings, importSettings } from '@/services/settings.service'
import Link from 'next/link'
import { getFavorites, removeFavorite } from '@/services/favorites.service'

const RecentChanges = lazy(() => import('./RecentChanges'))

function PinnedSettingsList() {
  const [items, setItems] = React.useState<Array<{ settingKey: string; route: string; label: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFavorites()
      setItems(data.map(d => ({ settingKey: d.settingKey, route: d.route, label: d.label })))
    } catch (e) {
      setError('Failed to load pinned settings')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="mt-4 space-y-2" role="status" aria-live="polite">
        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return <div className="mt-4 text-sm text-red-600">{error}</div>
  }

  if (!items.length) {
    return <div className="mt-4 text-sm text-muted-foreground">No pinned settings yet.</div>
  }

  return (
    <ul className="mt-4 space-y-2">
      {items.map((it) => (
        <li key={it.settingKey} className="flex items-center justify-between">
          <Link href={it.route} className="text-sm text-gray-700 hover:underline">{it.label}</Link>
          <Badge className="bg-blue-100 text-blue-800">Pinned</Badge>
        </li>
      ))}
    </ul>
  )
}

function SettingsOverviewInner() {
  const [running, setRunning] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleRunDiagnostics = useCallback(async () => {
    try {
      setRunning(true)
      const res = await runDiagnostics()
      toast.success('Diagnostics completed')
      console.log('diagnostics', res)
      // Announce result via toast and ensure focus stays logical
    } catch (err) {
      toast.error('Diagnostics failed')
    } finally {
      setRunning(false)
    }
  }, [])

  const handleExport = useCallback(async () => {
    try {
      setExporting(true)
      const blob = await exportSettings()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'settings.json'
      a.rel = 'noopener'
      a.type = 'application/json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export started')
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.setAttribute('aria-label', 'Import settings file')
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        setImporting(true)
        const text = await file.text()
        try {
          const json = JSON.parse(text)
          await importSettings(json)
          toast.success('Import succeeded')
        } catch (e) {
          toast.error('Invalid JSON or import failed')
        } finally {
          setImporting(false)
        }
      }
      input.click()
    } catch (err) {
      toast.error('Import failed')
      setImporting(false)
    }
  }, [])

  return (
    <SettingsShell
      title="Settings Overview"
      description="System health, quick actions and recent changes"
      icon={undefined}
      sidebar={<SettingsNavigation />}
      showBackButton={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">System Health</h3>
            <p className="text-sm text-muted-foreground mt-1">Database, authentication, and integrations status</p>

            <div className="mt-4 space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Database</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Authentication</span>
                <Badge className="bg-green-100 text-green-800">Configured</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Integrations</span>
                <Badge className="bg-amber-100 text-amber-800">Partial</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="button" aria-label="Run diagnostics" onClick={handleRunDiagnostics} disabled={running}>
              {running ? 'Running…' : 'Run Diagnostics'}
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground mt-1">Export or import settings, run health checks</p>
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <Button type="button" aria-label="Export settings" onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting…' : 'Export'}</Button>
            <Button variant="secondary" type="button" aria-label="Import settings" onClick={handleImport} disabled={importing}>{importing ? 'Importing…' : 'Import'}</Button>
          </div>
        </SettingsCard>

        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Recent Changes</h3>
            <p className="text-sm text-muted-foreground mt-1">Latest configuration updates and audit events</p>

            <div className="mt-4 overflow-auto max-h-52">
              <Suspense fallback={<div className="text-sm text-gray-500">Loading recent changes…</div>}>
                <RecentChanges />
              </Suspense>
            </div>
          </div>
        </SettingsCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Pinned Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">Quick access to frequently used configuration</p>

            <PinnedSettingsList />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" aria-label="Manage pinned settings">Manage</Button>
          </div>
        </SettingsCard>
      </div>

    </SettingsShell>
  )
}

export default React.memo(SettingsOverviewInner)
