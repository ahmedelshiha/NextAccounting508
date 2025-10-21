'use client'

import Link from 'next/link'
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
    <div className="admin-sidebar-footer border-t border-gray-200 bg-white transition-all duration-300 p-4">
      <button
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full"
        onClick={isMobile ? onClose : undefined}
        aria-label="Menu Settings"
        title="Menu Settings"
      >
        <svg className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.23 3.7l.06.06c.5.5 1.2.7 1.82.33.4-.2 1-.3 1.51-.3H9a2 2 0 0 1 4 0h.09c.5 0 1.1.1 1.51.3.62.37 1.32.17 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.2.4-.3 1-.3 1.51V9c0 1.1.4 1.7 1 2.2z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Menu Settings</span>
      </button>
    </div>
  )
}
