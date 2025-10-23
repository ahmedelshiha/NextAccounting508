'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Globe } from 'lucide-react'

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
}

interface Props {
  status: TranslationStatus
}

export default function TranslationStatusCards({ status }: Props) {
  const { summary, coverage } = status

  const getStatusIcon = (pct: number) => {
    if (pct === 100) return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (pct >= 80) return <CheckCircle2 className="h-5 w-5 text-yellow-500" />
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusColor = (pct: number) => {
    if (pct === 100) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    if (pct >= 80) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
  }

  const statusCards = [
    {
      label: 'English',
      icon: '🇺🇸',
      pct: parseFloat(summary.enCoveragePct),
      translated: coverage.en?.translated || 0,
      total: coverage.en?.total || 0,
    },
    {
      label: 'العربية',
      icon: '🇸🇦',
      pct: parseFloat(summary.arCoveragePct),
      translated: coverage.ar?.translated || 0,
      total: coverage.ar?.total || 0,
    },
    {
      label: 'हिन्दी',
      icon: '🇮🇳',
      pct: parseFloat(summary.hiCoveragePct),
      translated: coverage.hi?.translated || 0,
      total: coverage.hi?.total || 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Keys Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Translation Keys</p>
              <p className="text-3xl font-bold mt-2">{summary.totalKeys}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-500 opacity-70" />
          </div>
        </CardContent>
      </Card>

      {/* Language Status Cards */}
      {statusCards.map(card => (
        <Card key={card.label} className={`border-2 ${getStatusColor(card.pct)}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{card.icon}</span>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.label}</p>
                </div>
                <p className="text-3xl font-bold mt-2">{card.pct.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {card.translated} of {card.total} keys
                </p>
              </div>
              {getStatusIcon(card.pct)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
