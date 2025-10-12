import React from 'react'
import { Building } from 'lucide-react'

interface SidebarHeaderProps {
  collapsed: boolean
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  return (
    <div className="flex items-center h-16 px-4 border-b border-gray-200">
      <Building className="h-8 w-8 text-blue-600" />
      {!collapsed && (
        <div className="ml-3">
          <h1 className="text-lg font-semibold text-gray-900">NextAccounting</h1>
          <p className="text-xs text-gray-500">Admin Portal</p>
        </div>
      )}
    </div>
  )
}

export default SidebarHeader
