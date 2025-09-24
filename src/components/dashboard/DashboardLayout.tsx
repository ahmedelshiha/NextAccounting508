'use client'

'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAdminContext } from '@/components/admin/providers/AdminContext'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useAdminContext()
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200`}>
        <Sidebar />
      </aside>
      <div className={sidebarCollapsed ? 'ml-16' : 'ml-64'}>
        <Topbar />
        <main className="px-6 py-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        {/* Passive performance metrics collection for admin pages */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore - defer import to avoid SSR issues */}
        {typeof window !== 'undefined' && (require('./PerfMetricsReporter').default ? require('./PerfMetricsReporter').default() : null)}
      </div>
    </div>
  )
}
