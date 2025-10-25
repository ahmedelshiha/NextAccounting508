'use client'

import React from 'react'
import { LanguageActivityHeatmap } from '../components/LanguageActivityHeatmap'
import { Info } from 'lucide-react'

export const HeatmapTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="rounded-lg border bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900">Language Activity Heatmap</h4>
          <p className="text-sm text-blue-800 mt-1">
            Visualize language usage patterns across your organization. The heatmap shows session counts by language and time period, helping you understand language adoption trends and peak usage times.
          </p>
        </div>
      </div>

      {/* Heatmap Component */}
      <LanguageActivityHeatmap />

      {/* Usage Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">How to Read the Heatmap</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <strong>Rows</strong> represent different languages</li>
            <li>• <strong>Columns</strong> represent time periods (hourly)</li>
            <li>• <strong>Colors</strong> indicate usage intensity (darker = more activity)</li>
            <li>• <strong>Numbers</strong> show the exact session count</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Time Period Selection</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <strong>7d</strong> - Last 7 days (hourly granularity)</li>
            <li>• <strong>14d</strong> - Last 2 weeks (hourly granularity)</li>
            <li>• <strong>30d</strong> - Last month (hourly granularity)</li>
            <li>• Use these to identify trends and patterns</li>
          </ul>
        </div>
      </div>

      {/* Analysis Tips */}
      <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-6">
        <h4 className="text-sm font-semibold text-purple-900 mb-3">Analysis Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
          <div>
            <p className="font-semibold mb-1">📈 Peak Usage</p>
            <p>Look for darker cells to identify times when language preferences are changing most frequently</p>
          </div>
          <div>
            <p className="font-semibold mb-1">🌍 Language Adoption</p>
            <p>Compare language rows to see which languages are being adopted or declining over time</p>
          </div>
          <div>
            <p className="font-semibold mb-1">⏰ Trend Analysis</p>
            <p>Use different time periods to identify daily, weekly, or monthly usage patterns</p>
          </div>
        </div>
      </div>
    </div>
  )
}
