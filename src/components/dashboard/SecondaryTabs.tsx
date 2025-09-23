import { KeyboardEvent } from 'react'
import type { TabItem } from '@/types/dashboard'

export default function SecondaryTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
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
    <div className="flex items-center gap-2" role="tablist" aria-label="Secondary tabs">
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
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selected ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {t.label}
            {t.count != null && <span className="ml-2 text-xs opacity-80">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
