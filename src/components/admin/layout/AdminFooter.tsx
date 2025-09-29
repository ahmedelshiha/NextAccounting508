'use client'

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
    { label: 'Main Site', href: '/', icon: ExternalLink, external: true },
  ]

  const environment = process.env.NODE_ENV || 'development'

  return (
    <footer className={`bg-white border-t border-gray-200 px-4 py-2 mt-auto ${className}`} role="contentinfo" aria-label="Admin dashboard footer">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          {primaryLinks.map((link) => {
            const Icon = link.icon as any
            return (
              <Link key={link.href} href={link.href} className="flex items-center gap-2 hover:text-gray-900">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${environment === 'production' ? 'bg-green-500' : 'bg-yellow-400'}`} />
            <span className="sr-only">System status</span>
            <span>{environment === 'production' ? 'Operational' : 'Dev'}</span>
          </div>
          <div className="text-xs text-gray-400">© 2025 NextAccounting</div>
        </div>
      </div>
    </footer>
  )
}
