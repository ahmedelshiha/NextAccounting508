'use client'

import React from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { Code2 } from 'lucide-react'

export const DiscoveryTab: React.FC = () => {
  const {} = useLocalizationContext()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Key Discovery</h3>
        <p className="text-sm text-gray-600 mb-6">Scan your codebase for all translation keys</p>

        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex gap-4">
              <Code2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Automated Key Discovery</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Scan your codebase for all <code className="bg-blue-100 px-2 py-1 rounded">t('key')</code> calls to identify:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 mb-4">
                  <li>Keys in code but missing from translation files</li>
                  <li>Orphaned keys in JSON files not used in code</li>
                  <li>Missing translations for Arabic and Hindi</li>
                  <li>Unused or deprecated translation keys</li>
                </ul>
                <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                  <button className="px-6 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium">
                    Run Discovery Audit
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Manual Audit</h4>
            <p className="text-sm text-gray-600 mb-3">Run this command in your terminal:</p>
            <code className="block bg-gray-900 text-gray-100 px-4 py-3 rounded font-mono text-sm overflow-x-auto">
              npm run discover:keys
            </code>
            <p className="text-xs text-gray-600 mt-3">
              Output: <code className="text-gray-700 bg-gray-100 px-2 py-1 rounded">translation-key-audit.json</code>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Coming soon:</strong> Auto-discovery results, naming validation, approval workflow, and scheduled audits
          </p>
        </div>
      </div>
    </div>
  )
}
