'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SettingsShell, { SettingsSection, SettingsCard } from '@/components/admin/settings/SettingsShell'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import Tabs from '@/components/admin/settings/Tabs'
import { AlertCircle, Activity } from 'lucide-react'
import { formatISO } from 'date-fns'
import type { CronTelemetrySettings } from '@/schemas/settings/cron-telemetry'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'performance', label: 'Performance' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'status', label: 'Status' },
]

export default function CronTelemetryContent() {
  const [activeTab, setActiveTab] = useState('overview')
  const [settings, setSettings] = useState<CronTelemetrySettings | null>(null)
  const [pending, setPending] = useState<Partial<CronTelemetrySettings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [runs, setRuns] = useState<any[]>([])

  const searchParams = useSearchParams()
  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && tabs.some(tab => tab.key === t)) setActiveTab(t)
  }, [searchParams])

  useEffect(() => {
    loadSettings()
    loadTelemetryData()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cron-telemetry-settings', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setPending({})
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTelemetryData() {
    try {
      const res = await fetch('/api/admin/cron-telemetry-data', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setRuns(data.runs || [])
      }
    } catch (error) {
      console.error('Failed to load telemetry data:', error)
    }
  }

  function updateSetting(section: keyof CronTelemetrySettings, field: string, value: any) {
    setPending(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any) || {},
        [field]: value
      }
    }))
  }

  async function onSave() {
    if (!Object.keys(pending).length) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/cron-telemetry-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pending)
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setPending({})
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const totalProcessed = runs.reduce((sum, r) => sum + (r.processed || 0), 0)
  const totalFailed = runs.reduce((sum, r) => sum + (r.failed || 0), 0)
  const averageErrorRate = totalProcessed > 0 ? (totalFailed / totalProcessed) : 0

  return (
    <SettingsShell
      title="Cron Reminders Telemetry"
      description="Monitor and configure cron reminder jobs, performance, and reliability"
      icon={Activity}
      showBackButton={true}
      saving={saving}
      saved={saved}
      actions={
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.ANALYTICS_VIEW}>
            <button
              onClick={onSave}
              disabled={saving || Object.keys(pending).length === 0}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </PermissionGate>
          <FavoriteToggle
            settingKey="cronTelemetry"
            route="/admin/settings/cron-telemetry"
            label="Cron Telemetry"
          />
        </div>
      }
      tabs={tabs}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      loading={loading}
    >
      <div className="space-y-6">
        {activeTab === 'overview' && settings && (
          <>
            <SettingsSection
              title="Summary Metrics"
              description="Overview of recent cron reminder job executions"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                    <p className="text-3xl font-bold">{runs.length}</p>
                  </div>
                </SettingsCard>

                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Messages Processed</p>
                    <p className="text-3xl font-bold">{totalProcessed.toLocaleString()}</p>
                  </div>
                </SettingsCard>

                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Failed Count</p>
                    <p className={`text-3xl font-bold ${totalFailed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalFailed}
                    </p>
                  </div>
                </SettingsCard>

                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className={`text-3xl font-bold ${averageErrorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                      {(averageErrorRate * 100).toFixed(2)}%
                    </p>
                  </div>
                </SettingsCard>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Recent Runs"
              description="Last 20 cron reminder job executions"
            >
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Run ID</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Processed</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sent</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Failed</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Error %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.length > 0 ? (
                        runs.map((r) => (
                          <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{String(r.id).slice(0, 8)}</td>
                            <td className="px-4 py-3 text-sm">{r.at ? formatISO(new Date(r.at)) : '-'}</td>
                            <td className="px-4 py-3 text-right">{r.processed}</td>
                            <td className="px-4 py-3 text-right">{r.sent}</td>
                            <td className="px-4 py-3 text-right">{r.failed}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={r.errorRate > 0.05 ? 'text-red-600 font-medium' : ''}>
                                {(Number(r.errorRate || 0) * 100).toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No cron reminder runs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </SettingsSection>
          </>
        )}

        {activeTab === 'performance' && settings?.performance && (
          <SettingsSection
            title="Performance Configuration"
            description="Control concurrency, batch sizes, and processing limits"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Global Concurrency Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={pending.performance?.globalConcurrency ?? settings.performance?.globalConcurrency ?? 10}
                    onChange={(e) => updateSetting('performance', 'globalConcurrency', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max parallel jobs across all tenants</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant Concurrency Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={pending.performance?.tenantConcurrency ?? settings.performance?.tenantConcurrency ?? 3}
                    onChange={(e) => updateSetting('performance', 'tenantConcurrency', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max parallel jobs per tenant</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={pending.performance?.batchSize ?? settings.performance?.batchSize ?? 100}
                    onChange={(e) => updateSetting('performance', 'batchSize', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Records processed per batch</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Timeout (ms)
                  </label>
                  <input
                    type="number"
                    min={5000}
                    max={300000}
                    step={5000}
                    value={pending.performance?.processingTimeoutMs ?? settings.performance?.processingTimeoutMs ?? 60000}
                    onChange={(e) => updateSetting('performance', 'processingTimeoutMs', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max time for a processing cycle</p>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeTab === 'reliability' && settings?.reliability && (
          <SettingsSection
            title="Reliability Configuration"
            description="Control retry policies and error handling"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={pending.reliability?.maxRetries ?? settings.reliability?.maxRetries ?? 3}
                    onChange={(e) => updateSetting('reliability', 'maxRetries', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of retry attempts</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backoff Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={100}
                    step={0.1}
                    value={pending.reliability?.backoffThresholdPercent ?? settings.reliability?.backoffThresholdPercent ?? 10}
                    onChange={(e) => updateSetting('reliability', 'backoffThresholdPercent', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Error rate threshold to trigger backoff</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backoff Multiplier
                  </label>
                  <input
                    type="number"
                    min={1.0}
                    max={10.0}
                    step={0.1}
                    value={pending.reliability?.backoffMultiplier ?? settings.reliability?.backoffMultiplier ?? 2.0}
                    onChange={(e) => updateSetting('reliability', 'backoffMultiplier', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Exponential backoff multiplier</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Backoff (ms)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={300000}
                    step={1000}
                    value={pending.reliability?.maxBackoffMs ?? settings.reliability?.maxBackoffMs ?? 60000}
                    onChange={(e) => updateSetting('reliability', 'maxBackoffMs', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum backoff delay</p>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeTab === 'monitoring' && settings?.monitoring && (
          <SettingsSection
            title="Monitoring Configuration"
            description="Configure alerts and metrics collection"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable Detailed Logging</span>
                  <button
                    onClick={() => updateSetting('monitoring', 'enableDetailedLogging', !(pending.monitoring?.enableDetailedLogging ?? settings.monitoring?.enableDetailedLogging))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(pending.monitoring?.enableDetailedLogging ?? settings.monitoring?.enableDetailedLogging) ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(pending.monitoring?.enableDetailedLogging ?? settings.monitoring?.enableDetailedLogging) ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable Metrics Collection</span>
                  <button
                    onClick={() => updateSetting('monitoring', 'enableMetricsCollection', !(pending.monitoring?.enableMetricsCollection ?? settings.monitoring?.enableMetricsCollection))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(pending.monitoring?.enableMetricsCollection ?? settings.monitoring?.enableMetricsCollection) ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(pending.monitoring?.enableMetricsCollection ?? settings.monitoring?.enableMetricsCollection) ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Rate Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={50}
                    step={0.1}
                    value={pending.monitoring?.errorRateAlertThreshold ?? settings.monitoring?.errorRateAlertThreshold ?? 5}
                    onChange={(e) => updateSetting('monitoring', 'errorRateAlertThreshold', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when error rate exceeds this %</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Failed Count Alert Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={pending.monitoring?.failedCountAlertThreshold ?? settings.monitoring?.failedCountAlertThreshold ?? 100}
                    onChange={(e) => updateSetting('monitoring', 'failedCountAlertThreshold', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when failed count exceeds this</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metrics Retention (days)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={pending.monitoring?.metricsRetentionDays ?? settings.monitoring?.metricsRetentionDays ?? 30}
                    onChange={(e) => updateSetting('monitoring', 'metricsRetentionDays', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days to retain metrics data</p>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeTab === 'status' && settings?.status && (
          <SettingsSection
            title="Status Control"
            description="Enable/disable reminders and maintenance mode"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Reminders Enabled</span>
                <button
                  onClick={() => updateSetting('status', 'remindersEnabled', !(pending.status?.remindersEnabled ?? settings.status?.remindersEnabled))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(pending.status?.remindersEnabled ?? settings.status?.remindersEnabled) ? 'bg-green-600' : 'bg-red-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(pending.status?.remindersEnabled ?? settings.status?.remindersEnabled) ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm font-medium text-yellow-900">Maintenance Mode</span>
                <button
                  onClick={() => updateSetting('status', 'maintenanceMode', !(pending.status?.maintenanceMode ?? settings.status?.maintenanceMode))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(pending.status?.maintenanceMode ?? settings.status?.maintenanceMode) ? 'bg-yellow-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(pending.status?.maintenanceMode ?? settings.status?.maintenanceMode) ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {(pending.status?.maintenanceMode ?? settings.status?.maintenanceMode) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Mode Message
                  </label>
                  <textarea
                    value={pending.status?.maintenanceModeMessage ?? settings.status?.maintenanceModeMessage ?? ''}
                    onChange={(e) => updateSetting('status', 'maintenanceModeMessage', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">Message shown when maintenance mode is active</p>
                </div>
              )}
            </div>
          </SettingsSection>
        )}

        <SettingsCard className="bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">Performance Tuning Tips</p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Increase <code className="bg-blue-100 px-1 rounded">globalConcurrency</code> for higher throughput</li>
                <li>Lower <code className="bg-blue-100 px-1 rounded">tenantConcurrency</code> to prevent tenant overload</li>
                <li>Adjust <code className="bg-blue-100 px-1 rounded">backoffThresholdPercent</code> based on error patterns</li>
                <li>Monitor <code className="bg-blue-100 px-1 rounded">errorRate</code> and adjust <code className="bg-blue-100 px-1 rounded">maxRetries</code> accordingly</li>
              </ul>
            </div>
          </div>
        </SettingsCard>
      </div>
    </SettingsShell>
  )
}
