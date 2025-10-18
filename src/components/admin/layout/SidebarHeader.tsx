'use client'

import { Building, Menu, X } from 'lucide-react'
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
    <div className="header-container h-16 border-b border-gray-200 flex items-center justify-between transition-all duration-300 px-4">
      {!collapsedState ? (
        <div className="expanded-header flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">NextAccounting</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="collapse-btn p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Ctrl+B)"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCollapsed(false)}
          className="expand-btn w-full flex items-center justify-center p-2 hover:bg-gray-100 active:bg-gray-200 rounded-md transition-colors"
          aria-label="Expand sidebar"
          title="Expand sidebar (Ctrl+B)"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {isMobile && (
        <button
          onClick={() => setMobileOpen(false)}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  )
}
