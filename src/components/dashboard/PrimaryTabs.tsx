import type { TabItem } from '@/types/dashboard'

export default function PrimaryTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => onChange(t.key)} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${active === t.key ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <span>{t.label}</span>
            {t.count != null && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active === t.key ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
