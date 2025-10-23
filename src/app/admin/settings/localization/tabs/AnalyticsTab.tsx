'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { BarChart3 } from 'lucide-react'

export const AnalyticsTab: React.FC = () => {
  const { analyticsData, loading, setLoading } = useLocalizationContext()
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true)
      const r = await fetch('/api/admin/user-language-analytics')
      if (r.ok) {
        const d = await r.json()
        // State would be updated via context
      }
    } catch (e) {
      console.error('Failed to load analytics:', e)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Language Distribution</h3>
        <p className="text-sm text-gray-600 mb-6">Current language preferences across your users</p>

        {analyticsLoading || loading ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : analyticsData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analyticsData.totalUsers}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-medium text-gray-600">Languages in Use</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analyticsData.languagesInUse.length}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-medium text-gray-600">Most Used Language</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analyticsData.mostUsedLanguage?.toUpperCase() || 'N/A'}</p>
              </div>
            </div>

            {analyticsData.distribution && analyticsData.distribution.length > 0 && (
              <div className="rounded-lg border bg-white p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Language Distribution</h4>
                <div className="space-y-3">
                  {analyticsData.distribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-900">{item.language}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{item.count} users</span>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No analytics data available</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Coming soon:</strong> Adoption trends, cohort analysis, feature usage breakdown, and regional heatmaps
          </p>
        </div>
      </div>
    </div>
  )
}
