'use client'

import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SidebarFooterProps {
  collapsed: boolean
  isMobile?: boolean
  onClose?: () => void
}

export default function SidebarFooter({ collapsed, isMobile, onClose }: SidebarFooterProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'ADMIN'

  return (
    <div className="p-4 border-t border-gray-200">
      {!collapsed && (
        <Link href="/admin/help" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100" onClick={isMobile ? onClose : undefined}>
          <HelpCircle className="h-5 w-5 mr-3 text-gray-400" />
          Help & Support
        </Link>
      )}

      {collapsed && (
        <div className="w-full flex justify-center pt-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">U</span>
          </div>
        </div>
      )}
    </div>
  )
}
