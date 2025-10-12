import React from 'react'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'

interface SidebarFooterProps {
  collapsed: boolean
  onLinkClick?: () => void
}

export function SidebarFooter({ collapsed, onLinkClick }: SidebarFooterProps) {
  if (collapsed) return null
  return (
    <div className="p-4 border-t border-gray-200">
      <Link href="/admin/help" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100" onClick={onLinkClick}>
        <HelpCircle className="h-5 w-5 mr-3 text-gray-400" />
        Help & Support
      </Link>
    </div>
  )
}

export default SidebarFooter
