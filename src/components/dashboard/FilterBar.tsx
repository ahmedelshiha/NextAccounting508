import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { FilterConfig } from '@/types/dashboard'

export default function FilterBar({ filters, onFilterChange, onSearch, active = [], searchPlaceholder = 'Search...' }: { filters: FilterConfig[]; onFilterChange: (key: string, value: string) => void; onSearch?: (value: string) => void; active?: Array<{ key: string; label: string; value: string }>; searchPlaceholder?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        {onSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input onChange={(e) => onSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder={searchPlaceholder} />
          </div>
        )}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <select key={f.key} value={f.value ?? ''} onChange={(e) => onFilterChange(f.key, e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
            <SlidersHorizontal className="w-4 h-4" />
            Customize
          </button>
        </div>
      </div>
      {active.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {active.map((t) => (
            <span key={t.key} className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-sm">
              <span>{t.label}: {t.value}</span>
              <button onClick={() => onFilterChange(t.key, '')} className="hover:bg-green-100 rounded p-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
