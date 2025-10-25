'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { toast } from 'sonner'
import { TextField } from '@/components/admin/settings/FormField'
import { ChevronDown, Copy, Check, AlertCircle } from 'lucide-react'
import { useCache, invalidateCrowdinCaches } from '../hooks/useCache'
import { useFormMutation } from '../hooks/useFormMutation'

interface ProjectHealth {
  language: string
  completion: number
}

interface SyncLog {
  id: string
  syncedAt: Date | string
  status: 'success' | 'failed' | 'partial'
  keysAdded?: number
  keysUpdated?: number
  error?: string
}

interface WebhookConfig {
  webhookUrl: string
  isActive: boolean
  events: string[]
  lastDelivery?: string
  deliveriesCount: number
}

export const IntegrationTab: React.FC = () => {
  const { crowdinIntegration, setCrowdinIntegration, saving: contextSaving, setSaving: setContextSaving } = useLocalizationContext()
  const { cachedFetch } = useCache()
  const { mutate, saving } = useFormMutation()
  const [loading, setLoading] = useState(true)
  const [crowdinTestLoading, setCrowdinTestLoading] = useState(false)
  const [crowdinTestResult, setCrowdinTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [showSyncLogs, setShowSyncLogs] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)
  const [showWebhookDetails, setShowWebhookDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load all data in parallel for better performance
      // Each request is independent and can be made simultaneously
      // Response caching prevents duplicate requests even with parallel loading
      await Promise.all([
        loadCrowdinIntegration(),
        loadProjectHealth(),
        loadSyncLogs(),
        loadWebhookConfig(),
      ])
    } catch (e) {
      console.error('Failed to load integration data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadCrowdinIntegration() {
    try {
      const d = await cachedFetch<{ data: any }>('/api/admin/crowdin-integration', {
        ttlMs: 5 * 60 * 1000, // 5 minute cache
      })
      if (d.data) {
        setCrowdinIntegration({
          projectId: d.data.projectId || '',
          apiToken: d.data.apiTokenMasked || '',
          autoSyncDaily: d.data.autoSyncDaily ?? true,
          syncOnDeploy: d.data.syncOnDeploy ?? false,
          createPrs: d.data.createPrs ?? true,
        })
      }
    } catch (e) {
      console.error('Failed to load Crowdin integration:', e)
    }
  }

  async function loadProjectHealth() {
    try {
      const d = await cachedFetch<{ data: ProjectHealth[] }>('/api/admin/crowdin-integration/project-health', {
        ttlMs: 5 * 60 * 1000, // 5 minute cache
      })
      setProjectHealth(d.data || [])
    } catch (e) {
      console.error('Failed to load project health:', e)
    }
  }

  async function loadSyncLogs() {
    try {
      setLogsLoading(true)
      const d = await cachedFetch<{ data: { logs: SyncLog[] } }>('/api/admin/crowdin-integration/logs?limit=10', {
        ttlMs: 5 * 60 * 1000, // 5 minute cache
      })
      setSyncLogs(d.data?.logs || [])
    } catch (e) {
      console.error('Failed to load sync logs:', e)
      setSyncLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  async function testCrowdinConnection() {
    setCrowdinTestLoading(true)
    setCrowdinTestResult(null)
    const res = await mutate(
      '/api/admin/crowdin-integration',
      'PUT',
      {
        projectId: crowdinIntegration.projectId,
        apiToken: crowdinIntegration.apiToken,
      },
      { invalidate: [] }
    )
    if (res.ok) {
      setCrowdinTestResult({ success: true, message: 'Connection successful!' })
      toast.success('Crowdin connection test passed')
    } else {
      const message = res.error || 'Connection test failed'
      setCrowdinTestResult({ success: false, message })
      toast.error(message)
    }
    setCrowdinTestLoading(false)
  }

  async function saveCrowdinIntegration() {
    const res = await mutate(
      '/api/admin/crowdin-integration',
      'POST',
      crowdinIntegration,
      { invalidate: [/crowdin-integration/] }
    )
    if (res.ok) {
      toast.success('Crowdin integration saved')
      await loadCrowdinIntegration()
    } else {
      toast.error(res.error || 'Failed to save integration')
    }
  }

  async function manualSync() {
    setCrowdinTestLoading(true)
    const res = await mutate(
      '/api/admin/crowdin-integration/sync',
      'POST',
      undefined,
      { invalidate: [/crowdin-integration/] }
    )
    if (res.ok) {
      toast.success('Sync started successfully')
      await Promise.all([loadCrowdinIntegration(), loadProjectHealth(), loadSyncLogs()])
    } else {
      toast.error(res.error || 'Failed to run sync')
    }
    setCrowdinTestLoading(false)
  }

  async function loadWebhookConfig() {
    try {
      setWebhookLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const r = await fetch('/api/admin/crowdin-integration/webhook', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (r.ok) {
        const d = await r.json()
        setWebhookConfig(d.data)
        setWebhookEnabled(d.data?.isActive || false)
      }
    } catch (e) {
      console.error('Failed to load webhook config:', e)
    } finally {
      setWebhookLoading(false)
    }
  }

  async function setupWebhook() {
    const res = await mutate(
      '/api/admin/crowdin-integration/webhook',
      'POST',
      { enabled: !webhookEnabled },
      { invalidate: [] }
    )
    if (res.ok) {
      toast.success('Webhook ' + (webhookEnabled ? 'disabled' : 'enabled') + ' successfully')
      await loadWebhookConfig()
    } else {
      toast.error(res.error || 'Failed to setup webhook')
    }
  }

  function copyWebhookUrl() {
    if (webhookConfig?.webhookUrl) {
      navigator.clipboard.writeText(webhookConfig.webhookUrl)
      setCopiedWebhookUrl(true)
      toast.success('Webhook URL copied to clipboard')
      setTimeout(() => setCopiedWebhookUrl(false), 2000)
    }
  }

  async function testWebhookDelivery() {
    setCrowdinTestLoading(true)
    const res = await mutate(
      '/api/admin/crowdin-integration/webhook/test',
      'POST',
      undefined,
      { invalidate: [] }
    )
    if (res.ok) {
      toast.success('Test webhook delivery sent successfully')
    } else {
      toast.error(res.error || 'Failed to test webhook delivery')
    }
    setCrowdinTestLoading(false)
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading integration settings...</div>
  }

  return (
    <div className="space-y-6">
      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crowdin Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <TextField
                label="Project ID"
                value={crowdinIntegration.projectId}
                onChange={v => setCrowdinIntegration(s => ({ ...s, projectId: v }))}
                placeholder="Your Crowdin project ID"
              />
              <p className="text-xs text-gray-600 mt-1">Found in Crowdin project settings</p>
            </div>
            <div>
              <TextField
                label="API Token"
                value={crowdinIntegration.apiToken}
                onChange={v => setCrowdinIntegration(s => ({ ...s, apiToken: v }))}
                placeholder="Your Crowdin API token"
                type="password"
              />
              <p className="text-xs text-gray-600 mt-1">Generate from Crowdin account settings</p>
            </div>
          </div>
          {crowdinTestResult && (
            <div className={`rounded-lg p-3 mb-4 ${crowdinTestResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <p className="text-sm">{crowdinTestResult.message}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={testCrowdinConnection}
              disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
              className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {crowdinTestLoading ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={saveCrowdinIntegration}
              disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || saving}
              className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Integration'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h4 className="font-semibold text-blue-900 mb-3">Sync Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={crowdinIntegration.autoSyncDaily}
                onChange={e => setCrowdinIntegration(s => ({ ...s, autoSyncDaily: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-blue-800">Auto-sync translations daily</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={crowdinIntegration.syncOnDeploy}
                onChange={e => setCrowdinIntegration(s => ({ ...s, syncOnDeploy: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-blue-800">Sync on code deployment</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={crowdinIntegration.createPrs}
                onChange={e => setCrowdinIntegration(s => ({ ...s, createPrs: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-blue-800">Create PRs for translations</span>
            </label>
          </div>
        </div>

        {/* Sync Status Dashboard */}
        <div className="rounded-lg border bg-white p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Sync Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Last Sync</p>
              <p className="text-lg font-medium text-gray-900">
                {crowdinIntegration.lastSyncAt ? new Date(crowdinIntegration.lastSyncAt).toLocaleString() : 'Never'}
              </p>
              {crowdinIntegration.lastSyncStatus && (
                <p className={`text-sm mt-1 ${crowdinIntegration.lastSyncStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {crowdinIntegration.lastSyncStatus}
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Connection</p>
              <p className={`text-lg font-medium ${crowdinIntegration.testConnectionOk ? 'text-green-600' : 'text-gray-500'}`}>
                {crowdinIntegration.testConnectionOk ? '✓ Connected' : '○ Not Connected'}
              </p>
              <button
                onClick={testCrowdinConnection}
                disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 underline"
              >
                Test now
              </button>
            </div>
          </div>

          {/* Manual Sync Button */}
          <div className="mt-4">
            <button
              onClick={manualSync}
              disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
              className="w-full px-4 py-2 rounded-md text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {crowdinTestLoading ? 'Syncing...' : '⚡ Sync Now'}
            </button>
          </div>
        </div>

        {/* Project Health Section */}
        {projectHealth.length > 0 && (
          <div className="rounded-lg border bg-white p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Project Health</h4>
            <div className="space-y-3">
              {projectHealth.map(lang => (
                <div key={lang.language} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{lang.language.toUpperCase()}</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${lang.completion}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{lang.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Logs Section */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowSyncLogs(!showSyncLogs)}>
            <h4 className="font-semibold text-gray-900">Sync Logs</h4>
            <button
              className="text-gray-600 hover:text-gray-900 transition-transform"
              style={{ transform: showSyncLogs ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {showSyncLogs && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logsLoading ? (
                <p className="text-sm text-gray-600 py-4 text-center">Loading logs...</p>
              ) : syncLogs.length > 0 ? (
                syncLogs.map(log => (
                  <div key={log.id} className="rounded-lg border bg-gray-50 p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {new Date(log.syncedAt).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </div>
                    {log.keysAdded && <p className="text-gray-600">Keys added: {log.keysAdded}</p>}
                    {log.keysUpdated && <p className="text-gray-600">Keys updated: {log.keysUpdated}</p>}
                    {log.error && <p className="text-red-600 text-xs">{log.error}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 py-4 text-center">No sync logs yet</p>
              )}
            </div>
          )}
        </div>

        {/* Webhook Configuration Section */}
        {webhookConfig && (
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowWebhookDetails(!showWebhookDetails)}>
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-900">Webhook Configuration</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${webhookEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {webhookEnabled ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <button
                className="text-gray-600 hover:text-gray-900 transition-transform"
                style={{ transform: showWebhookDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {showWebhookDetails && (
              <div className="space-y-4">
                {/* Webhook URL Section */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Webhook URL</p>
                  </div>
                  <p className="text-xs text-blue-700 mb-3">Copy this URL to your Crowdin project webhook settings to receive automatic translation notifications</p>

                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg border border-blue-300 bg-white p-3">
                      <code className="text-xs text-gray-700 break-all">{webhookConfig.webhookUrl}</code>
                    </div>
                    <button
                      onClick={copyWebhookUrl}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg border border-blue-300 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {copiedWebhookUrl ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Setup Instructions</h5>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="font-semibold text-gray-900 flex-shrink-0">1.</span>
                      <span>Go to your Crowdin project settings → Webhooks</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-gray-900 flex-shrink-0">2.</span>
                      <span>Click &quot;Add new webhook&quot;</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-gray-900 flex-shrink-0">3.</span>
                      <span>Paste the URL above in the &quot;Target URL&quot; field</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-gray-900 flex-shrink-0">4.</span>
                      <span>Select events: &quot;Translation completed&quot; and &quot;Translation updated&quot;</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-gray-900 flex-shrink-0">5.</span>
                      <span>Save the webhook</span>
                    </li>
                  </ol>
                </div>

                {/* Webhook Status */}
                <div className="rounded-lg border bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Webhook Status</p>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={webhookEnabled}
                          onChange={() => setupWebhook()}
                          disabled={saving}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {webhookEnabled ? 'Webhook is active' : 'Webhook is inactive'}
                        </span>
                      </label>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Last Delivery</p>
                      <p className="text-sm text-gray-700">
                        {webhookConfig.lastDelivery ? new Date(webhookConfig.lastDelivery).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  {webhookConfig.deliveriesCount > 0 && (
                    <p className="text-xs text-gray-600 mt-3">
                      Total deliveries: {webhookConfig.deliveriesCount}
                    </p>
                  )}
                </div>

                {/* Test Webhook Delivery */}
                <button
                  onClick={testWebhookDelivery}
                  disabled={!webhookEnabled || saving || crowdinTestLoading}
                  className="w-full px-4 py-2 rounded-lg border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {crowdinTestLoading ? 'Sending test delivery...' : 'Send Test Delivery'}
                </button>
              </div>
            )}
          </div>
        )}
      </PermissionGate>
    </div>
  )
}
