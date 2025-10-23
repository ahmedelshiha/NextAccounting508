'use client'

import React from 'react'
import { useLocalizationContext } from '../LocalizationProvider'

export const UserPreferencesTab: React.FC = () => {
  const { languages } = useLocalizationContext()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Language Preferences</h3>
        <p className="text-sm text-gray-600 mb-4">Manage and monitor user language selections</p>

        <div className="rounded-lg border bg-white p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">–</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Languages in Use</p>
              <p className="text-3xl font-bold text-gray-900">{languages.filter(l => l.enabled).length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-600">
            <div className="col-span-5">Language</div>
            <div className="col-span-4">Users</div>
            <div className="col-span-3 text-right">Percentage</div>
          </div>
          <div>
            {languages.map(lang => (
              <div key={lang.code} className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-b-0 items-center hover:bg-gray-50">
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <span>{lang.flag || '🌐'}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </div>
                </div>
                <div className="col-span-4">
                  <span className="text-sm text-gray-600">–</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm text-gray-600">–</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Coming soon:</strong> Advanced analytics including adoption trends, cohort analysis, and geographic heatmaps
          </p>
        </div>
      </div>
    </div>
  )
}
