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

  if (collapsed) {
    // Hide footer content when sidebar is collapsed
    return <div className="footer-container border-t border-gray-200 bg-white h-0 overflow-hidden transition-all duration-300" />
  }

  return (
    <div className="footer-container border-t border-gray-200 bg-white transition-all duration-300 p-4">
      <Link
        href="/admin/help"
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        onClick={isMobile ? onClose : undefined}
      >
        <HelpCircle className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
        <span>Help & Support</span>
      </Link>
    </div>
  )
}
