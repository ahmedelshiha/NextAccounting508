'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, BarChart3, TrendingUp, Users } from 'lucide-react'
import TranslationCoverageChart from '@/components/admin/translations/TranslationCoverageChart'
import TranslationStatusCards from '@/components/admin/translations/TranslationStatusCards'
import TranslationMissingKeys from '@/components/admin/translations/TranslationMissingKeys'
import TranslationRecentKeys from '@/components/admin/translations/TranslationRecentKeys'
import TranslationAnalyticsChart from '@/components/admin/translations/TranslationAnalyticsChart'

interface TranslationStatus {
  timestamp: string
  summary: {
    totalKeys: number
    enCoveragePct: string
    arCoveragePct: string
    hiCoveragePct: string
  }
  coverage: Record<string, {
    translated: number
    total: number
    pct: number
  }>
  userDistribution: Record<string, number>
  latestMetrics: any
}

export default function TranslationDashboardPage() {
  const [status, setStatus] = useState<TranslationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/translations/status')
        if (!res.ok) throw new Error('Failed to fetch translation status')
        const data = await res.json()
        setStatus(data)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('Failed to fetch translation status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading translation dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Translation Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Monitor translation coverage, track progress, and identify missing translations.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Last Updated */}
      {status && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(status.timestamp).toLocaleString()}
        </div>
      )}

      {/* Status Cards */}
      {status && <TranslationStatusCards status={status} />}

      {/* Coverage Chart */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Translation Coverage by Language
            </CardTitle>
            <CardDescription>
              Percentage of keys translated for each language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TranslationCoverageChart status={status} />
          </CardContent>
        </Card>
      )}

      {/* Analytics Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Translation Coverage Trends
          </CardTitle>
          <CardDescription>
            Historical coverage trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TranslationAnalyticsChart />
        </CardContent>
      </Card>

      {/* User Distribution */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Language Distribution
            </CardTitle>
            <CardDescription>
              Number of users with each language preference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">English</div>
                <div className="text-2xl font-bold mt-2">{status.userDistribution.en || 0}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">العربية</div>
                <div className="text-2xl font-bold mt-2">{status.userDistribution.ar || 0}</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">हिन्दी</div>
                <div className="text-2xl font-bold mt-2">{status.userDistribution.hi || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Keys Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Added Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recently Added Keys
            </CardTitle>
            <CardDescription>
              Translation keys added in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TranslationRecentKeys />
          </CardContent>
        </Card>

        {/* Missing Translations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Missing Translations
            </CardTitle>
            <CardDescription>
              Keys that need translation for Arabic or Hindi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TranslationMissingKeys />
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Review Missing Translations</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Check the "Missing Translations" section above for keys that need Arabic or Hindi translations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-300 flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Run Key Discovery Audit</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Run <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">npm run discover:keys</code> to scan for new translation keys in code.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-300 flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Update Translation Files</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add missing translations to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">src/app/locales/</code> JSON files.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
