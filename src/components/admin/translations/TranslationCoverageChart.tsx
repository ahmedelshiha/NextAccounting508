'use client'

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

export default function TranslationCoverageChart({ status }: Props) {
  const { summary } = status

  const languages = [
    { name: 'English', code: 'en', pct: parseFloat(summary.enCoveragePct), color: 'bg-blue-500' },
    { name: 'العربية (Arabic)', code: 'ar', pct: parseFloat(summary.arCoveragePct), color: 'bg-green-500' },
    { name: 'हिन्दी (Hindi)', code: 'hi', pct: parseFloat(summary.hiCoveragePct), color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {languages.map(lang => (
        <div key={lang.code}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang.name}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{lang.pct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`${lang.color} h-full transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(lang.pct, 100)}%` }}
            />
          </div>
        </div>
      ))}

      {/* Status Legend */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">✓</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">100% Complete</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">↗</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">80-99% Progress</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">⚠</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">&lt; 80% In Progress</p>
        </div>
      </div>
    </div>
  )
}
