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
      {/* Help & Support link removed as requested. Keeping footer spacing consistent with admin footer. */}
      <div className="w-full h-0" />
    </div>
  )
}
