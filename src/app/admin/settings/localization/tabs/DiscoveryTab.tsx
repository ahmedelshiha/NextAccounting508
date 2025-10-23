'use client'

import React, { useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { toast } from 'sonner'
import { Code2, RefreshCw } from 'lucide-react'

interface AuditResult {
  keysInCode: number
  keysInJson: number
  orphanedKeys: string[]
  missingTranslations: Record<string, string[]>
  namingIssues: { key: string; issue: string }[]
}

export const DiscoveryTab: React.FC = () => {
  const { saving, setSaving } = useLocalizationContext()
  const [auditRunning, setAuditRunning] = useState(false)
  const [auditResults, setAuditResults] = useState<AuditResult | null>(null)
  const [scheduledAudit, setScheduledAudit] = useState<'none' | 'daily' | 'weekly'>('none')

  async function runDiscoveryAudit() {
    setAuditRunning(true)
    setSaving(true)
    try {
      const r = await fetch('/api/admin/translations/discover', {
        method: 'POST',
      })
      const d = await r.json()

      if (r.ok && d.data) {
        setAuditResults(d.data)
        toast.success('Discovery audit completed')
      } else {
        toast.error('Failed to run discovery audit')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to run discovery audit')
    } finally {
      setAuditRunning(false)
      setSaving(false)
    }
  }

  async function scheduleAudit() {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/translations/discover/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: scheduledAudit }),
      })

      if (r.ok) {
        toast.success(`Audit scheduled: ${scheduledAudit === 'none' ? 'Disabled' : scheduledAudit}`)
      } else {
        toast.error('Failed to schedule audit')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to schedule audit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        {/* Main Audit Panel */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex gap-4">
            <Code2 className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Automated Key Discovery</h4>
              <p className="text-sm text-blue-800 mb-4">
                Scan your codebase for all <code className="bg-blue-100 px-2 py-1 rounded text-xs">t(&apos;key&apos;)</code> calls to identify translation gaps and optimize your i18n setup.
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 mb-4">
                <li>Keys in code but missing from translation files</li>
                <li>Orphaned keys in JSON files not used anywhere</li>
                <li>Missing translations for Arabic and Hindi</li>
                <li>Naming convention violations</li>
              </ul>
              <button
                onClick={runDiscoveryAudit}
                disabled={auditRunning || saving}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${auditRunning ? 'animate-spin' : ''}`} />
                {auditRunning ? 'Running Audit...' : 'Run Discovery Audit'}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Results */}
        {auditResults && (
          <div className="rounded-lg border bg-white p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Audit Results</h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-600">Keys in Code</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{auditResults.keysInCode}</p>
              </div>
              <div className="rounded-lg border bg-blue-50 p-4">
                <p className="text-sm font-medium text-gray-600">Keys in JSON</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{auditResults.keysInJson}</p>
              </div>
              <div className="rounded-lg border bg-orange-50 p-4">
                <p className="text-sm font-medium text-gray-600">Orphaned Keys</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{auditResults.orphanedKeys.length}</p>
              </div>
              <div className="rounded-lg border bg-red-50 p-4">
                <p className="text-sm font-medium text-gray-600">Issues Found</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {auditResults.namingIssues.length +
                    Object.values(auditResults.missingTranslations).reduce((sum, arr) => sum + arr.length, 0)}
                </p>
              </div>
            </div>

            {/* Orphaned Keys */}
            {auditResults.orphanedKeys.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-orange-100 text-xs font-medium text-orange-700">
                    {auditResults.orphanedKeys.length}
                  </span>
                  Orphaned Keys (Not Used in Code)
                </h4>
                <div className="rounded-lg border bg-orange-50 p-4 space-y-2">
                  {auditResults.orphanedKeys.slice(0, 10).map(key => (
                    <p key={key} className="text-sm text-orange-900">
                      • <code className="text-xs bg-orange-100 px-2 py-1 rounded">{key}</code>
                    </p>
                  ))}
                  {auditResults.orphanedKeys.length > 10 && (
                    <p className="text-sm text-orange-700 font-medium">
                      + {auditResults.orphanedKeys.length - 10} more orphaned keys
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Missing Translations */}
            {Object.keys(auditResults.missingTranslations).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-red-100 text-xs font-medium text-red-700">
                    {Object.values(auditResults.missingTranslations).reduce((sum, arr) => sum + arr.length, 0)}
                  </span>
                  Missing Translations
                </h4>
                <div className="space-y-4">
                  {Object.entries(auditResults.missingTranslations).map(([lang, keys]) => (
                    <div key={lang} className="rounded-lg border bg-red-50 p-4">
                      <p className="font-medium text-gray-900 mb-2">{lang.toUpperCase()}</p>
                      <div className="space-y-1">
                        {keys.slice(0, 5).map(key => (
                          <p key={key} className="text-sm text-gray-700">
                            • <code className="text-xs bg-red-100 px-2 py-1 rounded">{key}</code>
                          </p>
                        ))}
                        {keys.length > 5 && (
                          <p className="text-sm text-gray-700 font-medium">+ {keys.length - 5} more keys</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Naming Issues */}
            {auditResults.namingIssues.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-xs font-medium text-yellow-700">
                    {auditResults.namingIssues.length}
                  </span>
                  Naming Convention Issues
                </h4>
                <div className="rounded-lg border bg-yellow-50 p-4 space-y-2">
                  {auditResults.namingIssues.map((issue, idx) => (
                    <p key={idx} className="text-sm text-yellow-900">
                      • <code className="text-xs bg-yellow-100 px-2 py-1 rounded">{issue.key}</code> - {issue.issue}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule Audits */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Automatic Audits</h3>
          <p className="text-sm text-gray-600 mb-4">Run discovery audits automatically to stay on top of translation gaps</p>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="schedule"
                value="none"
                checked={scheduledAudit === 'none'}
                onChange={e => setScheduledAudit(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Disabled</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="schedule"
                value="daily"
                checked={scheduledAudit === 'daily'}
                onChange={e => setScheduledAudit(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Daily at 2:00 AM</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="schedule"
                value="weekly"
                checked={scheduledAudit === 'weekly'}
                onChange={e => setScheduledAudit(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Weekly on Monday at 2:00 AM</span>
            </label>
          </div>

          <button
            onClick={scheduleAudit}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </PermissionGate>

      {/* Info Box */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          💡 Discovery audits scan your codebase for <code className="bg-blue-100 px-1">t('key')</code> patterns and compare them with your translation JSON files to identify gaps and orphaned keys.
        </p>
      </div>
    </div>
  )
}
