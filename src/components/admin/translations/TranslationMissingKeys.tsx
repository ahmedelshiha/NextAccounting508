'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Loader2 } from 'lucide-react'

interface MissingKey {
  id: string
  key: string
  namespace?: string
  enTranslated: boolean
  arTranslated: boolean
  hiTranslated: boolean
}

interface MissingKeysResponse {
  language: string
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
  keys: MissingKey[]
}

export default function TranslationMissingKeys() {
  const [arKeys, setArKeys] = useState<MissingKeysResponse | null>(null)
  const [hiKeys, setHiKeys] = useState<MissingKeysResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMissingKeys = async () => {
      try {
        setLoading(true)
        const [arRes, hiRes] = await Promise.all([
          fetch('/api/admin/translations/missing?language=ar&limit=10'),
          fetch('/api/admin/translations/missing?language=hi&limit=10'),
        ])

        if (!arRes.ok || !hiRes.ok) {
          throw new Error('Failed to fetch missing keys')
        }

        setArKeys(await arRes.json())
        setHiKeys(await hiRes.json())
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('Failed to fetch missing keys:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMissingKeys()
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

  const languages = [
    { code: 'ar', label: 'العربية (Arabic)', data: arKeys },
    { code: 'hi', label: 'हिन्दी (Hindi)', data: hiKeys },
  ]

  return (
    <Tabs defaultValue="ar">
      <TabsList className="grid w-full grid-cols-2">
        {languages.map(lang => (
          <TabsTrigger key={lang.code} value={lang.code}>
            {lang.label}
            {lang.data && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold">
                {lang.data.pagination.total}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {languages.map(lang => (
        <TabsContent key={lang.code} value={lang.code} className="mt-4">
          {lang.data && lang.data.keys.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lang.data.keys.map(key => (
                <div
                  key={key.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{key.key}</p>
                      {key.namespace && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Namespace: <span className="font-medium">{key.namespace}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {key.enTranslated && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
                          EN
                        </span>
                      )}
                      {key.arTranslated && (
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
                          AR
                        </span>
                      )}
                      {key.hiTranslated && (
                        <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded">
                          HI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ✓ All keys translated for {lang.label}
              </p>
            </div>
          )}

          {lang.data && lang.data.pagination.total > lang.data.keys.length && (
            <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {lang.data.keys.length} of {lang.data.pagination.total} missing translations
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
