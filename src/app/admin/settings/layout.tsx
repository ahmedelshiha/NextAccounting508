import React from 'react'
import SettingsNavigation from '@/components/admin/SettingsNavigation'
import { isUnifiedSettingsEnabled } from '@/lib/featureFlags'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const enabled = isUnifiedSettingsEnabled()

  return (
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 py-8">
      <aside className="hidden md:block lg:hidden">
        <SettingsNavigation />
      </aside>
      <main>
        {!enabled && (
          <div className="mb-4 rounded-md border p-3 bg-yellow-50 text-yellow-800">
            Unified Settings feature is disabled. To enable, set NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS=true in your environment.
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
