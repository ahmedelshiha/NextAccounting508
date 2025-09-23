import { KeyboardEvent } from 'react'
import type { TabItem } from '@/types/dashboard'

export default function PrimaryTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const last = tabs.length - 1
    let next = idx
    if (e.key === 'ArrowRight') next = idx === last ? 0 : idx + 1
    else if (e.key === 'ArrowLeft') next = idx === 0 ? last : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(tabs[next].key)
  }

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Primary tabs">
        {tabs.map((t, i) => {
          const selected = active === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => onChange(t.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${selected ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <span>{t.label}</span>
              {t.count != null && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{t.count}</span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
