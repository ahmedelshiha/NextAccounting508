'use client'

import React from 'react'
import { useLocalizationContext } from '../LocalizationProvider'

export const RegionalFormatsTab: React.FC = () => {
  const { languages, regionalFormats, setRegionalFormats } = useLocalizationContext()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Format Settings</h3>
        <p className="text-sm text-gray-600 mb-6">Configure date, time, and number formats per language</p>

        <div className="space-y-4">
          {languages.filter(l => l.enabled).map(lang => (
            <div key={lang.code} className="rounded-lg border bg-white p-4">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>{lang.flag || '🌐'}</span>
                {lang.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <input
                    type="text"
                    defaultValue={regionalFormats[lang.code]?.dateFormat || 'MM/DD/YYYY'}
                    placeholder="MM/DD/YYYY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">e.g., DD/MM/YYYY, YYYY-MM-DD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Format
                  </label>
                  <input
                    type="text"
                    defaultValue={regionalFormats[lang.code]?.timeFormat || 'HH:MM AM'}
                    placeholder="HH:MM AM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">e.g., HH:MM, HH:MM AM</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    defaultValue={regionalFormats[lang.code]?.currencyCode || 'USD'}
                    placeholder="USD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">ISO 4217 code (max 3 chars)</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Coming soon:</strong> Format templates, CLDR import, and live preview
          </p>
        </div>
      </div>
    </div>
  )
}
