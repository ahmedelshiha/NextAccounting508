'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react'

interface ChartDataPoint {
  date: string
  en: number
  ar: number
  hi: number
  totalKeys: number
}

interface AnalyticsData {
  summary: {
    period: { since: string; days: number }
    dataPoints: number
    current: { date: string; en: number; ar: number; hi: number } | null
    previous: { date: string; en: number; ar: number; hi: number } | null
    trend: { en: number; ar: number; hi: number } | null
  }
  chartData: ChartDataPoint[]
}

export default function TranslationAnalyticsChart() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/translations/analytics?days=${days}`)

        if (!res.ok) {
          throw new Error('Failed to fetch analytics')
        }

        setData(await res.json())
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [days])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900 dark:text-red-100">Error</p>
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available yet</p>
      </div>
    )
  }

  const { summary, chartData } = data

  // Simple ASCII chart rendering (since we can't use external charting libs)
  const maxPct = 100
  const renderBar = (pct: number, color: string) => {
    const width = Math.round((pct / maxPct) * 30)
    const bar = '█'.repeat(width) + '░'.repeat(30 - width)
    return `${bar} ${pct.toFixed(1)}%`
  }

  // Get latest values
  const latest = summary.current
  const previous = summary.previous
  const trend = summary.trend

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              days === d
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'English', key: 'en', color: 'blue' },
          { label: 'العربية', key: 'ar', color: 'green' },
          { label: 'हिन्दी', key: 'hi', color: 'orange' },
        ].map(lang => (
          <div
            key={lang.key}
            className={`bg-${lang.color}-50 dark:bg-${lang.color}-950 p-4 rounded border border-${lang.color}-200 dark:border-${lang.color}-800`}
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang.label}</p>
            {latest && (
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {((latest[lang.key as keyof typeof latest] as number) || 0).toFixed(1)}%
                </p>
                {trend && trend[lang.key as keyof typeof trend] !== undefined && (
                  <p
                    className={`text-sm font-medium mt-1 flex items-center gap-1 ${
                      trend[lang.key as keyof typeof trend] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <TrendingUp className={`h-4 w-4 ${trend[lang.key as keyof typeof trend] < 0 ? 'rotate-180' : ''}`} />
                    {trend[lang.key as keyof typeof trend] > 0 ? '+' : ''}
                    {trend[lang.key as keyof typeof trend].toFixed(2)}%
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ASCII Chart */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold mb-4 text-gray-900 dark:text-gray-100">Coverage Trend (Last {days} Days)</h3>
        <div className="space-y-3 font-mono text-xs">
          {[
            { name: 'EN', color: 'text-blue-600 dark:text-blue-400', data: chartData.map(d => d.en) },
            { name: 'AR', color: 'text-green-600 dark:text-green-400', data: chartData.map(d => d.ar) },
            { name: 'HI', color: 'text-orange-600 dark:text-orange-400', data: chartData.map(d => d.hi) },
          ].map(lang => (
            <div key={lang.name}>
              <p className={`font-bold mb-1 ${lang.color}`}>{lang.name}:</p>
              <p className={`whitespace-pre-wrap break-all ${lang.color}`}>
                {renderBar(lang.data[lang.data.length - 1] || 0, lang.color)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Table for Last 7 Days */}
      {chartData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-bold text-gray-900 dark:text-gray-100">Date</th>
                <th className="text-right py-2 px-3 font-bold text-blue-600 dark:text-blue-400">EN</th>
                <th className="text-right py-2 px-3 font-bold text-green-600 dark:text-green-400">AR</th>
                <th className="text-right py-2 px-3 font-bold text-orange-600 dark:text-orange-400">HI</th>
              </tr>
            </thead>
            <tbody>
              {chartData.slice(-7).reverse().map(row => (
                <tr key={row.date} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.date}</td>
                  <td className="text-right py-2 px-3 text-blue-600 dark:text-blue-400 font-medium">{row.en.toFixed(1)}%</td>
                  <td className="text-right py-2 px-3 text-green-600 dark:text-green-400 font-medium">{row.ar.toFixed(1)}%</td>
                  <td className="text-right py-2 px-3 text-orange-600 dark:text-orange-400 font-medium">{row.hi.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
