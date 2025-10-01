import React from 'react'
import SettingsNavigation from '@/components/admin/SettingsNavigation'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 py-8">
      <aside className="hidden md:block">
        <SettingsNavigation />
      </aside>
      <main>
        {children}
      </main>
    </div>
  )
}
