'use client'

import React from 'react'
import { useLocalizationContext } from '../LocalizationProvider'

export const TranslationsTab: React.FC = () => {
  const { translationStatus, languages } = useLocalizationContext()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Coverage</h3>
        <p className="text-sm text-gray-600 mb-6">Current translation status by language</p>

        {translationStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-gray-600">Total Keys</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{translationStatus.summary.totalKeys}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-gray-600">English</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{translationStatus.summary.enCoveragePct}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-gray-600">العربية</p>
              <p className="text-3xl font-bold mt-2">{translationStatus.summary.arCoveragePct}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-gray-600">हिन्दी</p>
              <p className="text-3xl font-bold mt-2">{translationStatus.summary.hiCoveragePct}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-gray-50 p-8 text-center">
            <p className="text-gray-600">Loading translation status...</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Coming soon:</strong> Coverage timeline, missing keys by category, translation velocity, and priority assignment
          </p>
        </div>
      </div>
    </div>
  )
}
