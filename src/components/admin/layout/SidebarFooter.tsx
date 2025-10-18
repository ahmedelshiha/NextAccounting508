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
  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="footer-container border-t border-gray-200 bg-white transition-all duration-300">
      {!collapsed ? (
        <div className="expanded-footer p-4">
          <Link
            href="/admin/help"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={isMobile ? onClose : undefined}
          >
            <HelpCircle className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
            <span>Help & Support</span>
          </Link>
        </div>
      ) : (
        <div className="collapsed-footer flex flex-col items-center justify-center py-4 px-2">
          <button
            onClick={isMobile ? onClose : undefined}
            className="user-avatar w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hover:shadow-md hover:from-blue-600 hover:to-blue-700 active:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            title={`User: ${userRole}`}
            aria-label={`User menu - ${userRole}`}
          >
            <span className="text-white font-bold text-xs leading-none">{userInitials}</span>
          </button>
        </div>
      )}
    </div>
  )
}
