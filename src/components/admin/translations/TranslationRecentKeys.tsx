'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, Clock } from 'lucide-react'

interface RecentKey {
  id: string
  key: string
  namespace?: string
  enTranslated: boolean
  arTranslated: boolean
  hiTranslated: boolean
  addedAt: string
}

interface RecentKeysResponse {
  period: {
    since: string
    days: number
  }
  count: number
  stats: {
    enNotTranslated: number
    arNotTranslated: number
    hiNotTranslated: number
  }
  keys: RecentKey[]
}

export default function TranslationRecentKeys() {
  const [data, setData] = useState<RecentKeysResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentKeys = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/translations/recent?days=7&limit=20')

        if (!res.ok) {
          throw new Error('Failed to fetch recent keys')
        }

        setData(await res.json())
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('Failed to fetch recent keys:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentKeys()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
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

  if (!data || data.count === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No new translation keys in the last 7 days
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.count}</p>
        </div>
        <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">Missing AR</p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.stats.arNotTranslated}</p>
        </div>
        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">Missing HI</p>
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{data.stats.hiNotTranslated}</p>
        </div>
      </div>

      {/* Recent Keys List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {data.keys.map(key => (
          <div
            key={key.id}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{key.key}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Added {new Date(key.addedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {key.enTranslated && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
                    ✓ EN
                  </span>
                )}
                {!key.arTranslated && (
                  <span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded">
                    ✗ AR
                  </span>
                )}
                {!key.hiTranslated && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded">
                    ✗ HI
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
