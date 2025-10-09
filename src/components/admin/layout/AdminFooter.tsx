import React from 'react'
import Link from 'next/link'
import { BookOpen, Settings, ExternalLink } from 'lucide-react'

interface AdminFooterProps {
  sidebarCollapsed?: boolean
  isMobile?: boolean
  className?: string
}

export default function AdminFooter({ sidebarCollapsed = false, isMobile = false, className = '' }: AdminFooterProps) {
  const primaryLinks = [
    { label: 'Analytics', href: '/admin/analytics', icon: BookOpen },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
    { label: 'Back to Main Site', href: '/', icon: ExternalLink, external: true },
  ]

  const APP_VERSION = 'v2.3.2'
  const RELEASE_DATE = 'Sept 26, 2025'
  const environment = process.env.NODE_ENV || 'development'

  if (isMobile) {
    return (
      <footer className={`bg-white border-t border-gray-200 px-4 py-3 mt-auto ${className}`} role="contentinfo" aria-label="Admin dashboard footer">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 text-sm text-gray-600">
          <div className="font-medium">NextAccounting Admin {APP_VERSION}</div>
          <div className="flex items-center gap-3">
            {primaryLinks.map((link) => {
              const Icon = link.icon as any
              return (
                <Link key={link.href} href={link.href} className="flex items-center gap-1.5 hover:text-gray-900">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${environment === 'production' ? 'bg-green-500' : 'bg-yellow-400'}`} />
            <span>System Operational</span>
            <span aria-label="environment">{environment}</span>
          </div>
          <div className="text-xs text-gray-400">© 2025 NextAccounting. All rights reserved.</div>
        </div>
      </footer>
    )
  }

  return (
    <footer className={`bg-white border-t border-gray-200 px-4 py-2 mt-auto ${className}`} role="contentinfo" aria-label="Admin dashboard footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-medium">NextAccounting Admin</span>
            <span className="text-xs text-gray-500">{APP_VERSION} · {RELEASE_DATE}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
            {primaryLinks.map((link) => {
              const Icon = link.icon as any
              return (
                <Link key={link.href} href={link.href} className="flex items-center gap-1.5 hover:text-gray-900">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${environment === 'production' ? 'bg-green-500' : 'bg-yellow-400'}`} />
          <span>System Operational</span>
          <span aria-label="environment">{environment}</span>
        </div>

        <div className="flex items-center justify-end gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">Support</span>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/admin/help" className="hover:text-gray-900">Admin Help</Link>
              <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
            </div>
          </div>
          <div className="text-xs text-gray-400">© 2025 NextAccounting. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
