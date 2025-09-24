'use client'

'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAdminContext } from '@/components/admin/providers/AdminContext'
import PerfMetricsReporter from './PerfMetricsReporter'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useAdminContext()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Accessible skip link for keyboard users to jump directly to the main content */}
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded"
        onClick={(e) => {
          const el = document.getElementById('admin-main-content') as HTMLElement | null
          if (el) {
            el.focus()
          }
        }}
      >
        Skip to main content
      </a>
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200`}
        role="navigation"
        aria-label="Admin sidebar"
      >
        <Sidebar />
      </aside>
      <div className={sidebarCollapsed ? 'ml-16' : 'ml-64'}>
        <Topbar />
        <main id="admin-main-content" tabIndex={-1} className="px-6 py-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        <PerfMetricsReporter />
      </div>
    </div>
  )
}
