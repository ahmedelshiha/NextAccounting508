'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { toast } from 'sonner'
import { Activity, TrendingUp } from 'lucide-react'
import type { LanguageActivityResponse } from '../../../api/admin/language-activity-analytics/route'

export const LanguageActivityHeatmap: React.FC = () => {
  const { languages } = useLocalizationContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LanguageActivityResponse | null>(null)
  const [selectedDays, setSelectedDays] = useState(7)
  const [hoveredCell, setHoveredCell] = useState<{ timestamp: string; language: string } | null>(null)

  useEffect(() => {
    loadActivityData()
  }, [selectedDays])

  async function loadActivityData() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const r = await fetch(`/api/admin/language-activity-analytics?days=${selectedDays}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setData(d.data)
      } else {
        toast.error('Failed to load activity data')
      }
    } catch (e: any) {
      const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Failed to load activity data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-12 text-center">Loading activity heatmap...</div>
  }

  if (!data || !data.periods.length) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No language activity data available yet</p>
        <p className="text-xs text-gray-500 mt-2">Activity tracking will begin once users change their language preferences</p>
      </div>
    )
  }

  const period = data.periods[0]
  const languageList = Array.from(new Set(period.data.map(d => d.language))).sort()
  const timestamps = Array.from(new Set(period.data.map(d => d.timestamp))).sort()

  const maxSessions = Math.max(...period.data.map(d => d.sessionCount), 1)

  function getIntensity(count: number): number {
    if (count === 0) return 0
    return Math.max(0.1, (count / maxSessions) * 100)
  }

  function getColorForIntensity(intensity: number): string {
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 20) return 'bg-blue-100'
    if (intensity < 40) return 'bg-blue-300'
    if (intensity < 60) return 'bg-blue-500'
    if (intensity < 80) return 'bg-blue-700'
    return 'bg-blue-900'
  }

  function getSessionCount(language: string, timestamp: string): number {
    const match = period.data.find(d => d.language === language && d.timestamp === timestamp)
    return match?.sessionCount || 0
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:00`
  }

  function getLanguageDisplay(code: string): { name: string; flag: string } {
    const lang = languages.find(l => l.code === code)
    return lang ? { name: lang.name, flag: lang.flag } : { name: code.toUpperCase(), flag: '🌐' }
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Language Activity Heatmap</h3>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Total Sessions</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{data.summary.totalSessions}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium">Active Users</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{data.summary.totalUsers}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 font-medium">Languages</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{data.summary.languagesTracked}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Column headers (timestamps) */}
          <div className="flex">
            <div className="w-24 flex-shrink-0" />
            <div className="flex gap-0.5">
              {timestamps.map(timestamp => (
                <div key={timestamp} className="w-12 text-center">
                  <div className="text-xs text-gray-600 truncate px-1">{formatTimestamp(timestamp).split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          {languageList.map(language => {
            const { name, flag } = getLanguageDisplay(language)
            return (
              <div key={language} className="flex items-center gap-0.5">
                <div className="w-24 flex-shrink-0 pr-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span>{flag}</span>
                    <span className="truncate">{name}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {timestamps.map(timestamp => {
                    const count = getSessionCount(language, timestamp)
                    const intensity = getIntensity(count)
                    const isHovered = hoveredCell?.timestamp === timestamp && hoveredCell?.language === language

                    return (
                      <button
                        key={`${language}-${timestamp}`}
                        onMouseEnter={() => setHoveredCell({ timestamp, language })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-12 h-12 rounded border border-gray-200 transition-all ${getColorForIntensity(intensity)} ${
                          isHovered ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''
                        }`}
                        title={`${name}: ${count} sessions on ${formatTimestamp(timestamp)}`}
                      >
                        <span className="text-xs font-semibold text-gray-900">{count > 0 ? count : ''}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">Intensity:</span>
          <div className="flex gap-2 items-center">
            {[
              { label: 'None', class: 'bg-gray-100' },
              { label: 'Low', class: 'bg-blue-100' },
              { label: 'Medium', class: 'bg-blue-500' },
              { label: 'High', class: 'bg-blue-900' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${item.class} border border-gray-300`} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4">
          <TrendingUp className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Top Language</h4>
            <p className="text-sm text-amber-800 mt-1">
              {languageList.length > 0
                ? `${getLanguageDisplay(languageList[0]).flag} ${getLanguageDisplay(languageList[0]).name} is the most active language in your system`
                : 'No activity data available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
