import type { TabItem } from '@/types/dashboard'

export default function SecondaryTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active === t.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
          {t.label}
          {t.count != null && <span className="ml-2 text-xs opacity-80">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
