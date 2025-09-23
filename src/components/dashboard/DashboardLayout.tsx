'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-200">
        <Sidebar />
      </aside>
      <div className="ml-64">
        <Topbar />
        <main className="px-6 py-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
