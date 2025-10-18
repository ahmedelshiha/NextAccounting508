'use client'

import { Building, ChevronsLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useResponsive } from '@/hooks/admin/useResponsive'
import { useSidebarActions, useSidebarCollapsed } from '@/stores/admin/layout.store.selectors'

interface SidebarHeaderProps {
  collapsed: boolean
}

export default function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  const { isMobile } = useResponsive()
  const collapsedState = useSidebarCollapsed()
  const { toggleSidebar, setCollapsed, setMobileOpen } = useSidebarActions()

  return (
    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 gap-2">
      <div className="flex items-center">
        <Building className="h-8 w-8 text-blue-600" />
        {!collapsedState && (
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">NextAccounting</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!collapsedState ? (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Ctrl+B)"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center py-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar (Ctrl+B)"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NA</span>
            </div>
          </button>
        )}

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}
