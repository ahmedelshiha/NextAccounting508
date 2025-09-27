/**
 * AdminFooter Component
 * Professional footer for admin dashboard with admin-specific links and information
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ExternalLink,
  Shield,
  HelpCircle,
  BookOpen,
  Activity,
  Settings,
  FileText,
  Clock,
  Users
} from 'lucide-react'

interface AdminFooterProps {
  /** Whether the sidebar is collapsed */
  sidebarCollapsed?: boolean
  /** Whether user is on mobile device */
  isMobile?: boolean
  /** Custom CSS classes */
  className?: string
}

/**
 * AdminFooter - Professional footer component for admin dashboard
 * 
 * This component provides admin-specific footer functionality separate from
 * the main website footer. It includes:
 * - Admin-specific navigation links
 * - System information and status
 * - Quick access to documentation
 * - Support and help resources
 * - Professional branding for admin area
 */
const AdminFooter: React.FC<AdminFooterProps> = ({
  sidebarCollapsed = false,
  isMobile = false,
  className = '',
}) => {
  const pathname = usePathname()

  // Admin-specific footer links organized by category
  const adminLinks = {
    system: [
      { label: 'System Status', href: '/admin/system-status', icon: Activity },
      { label: 'Analytics', href: '/admin/analytics', icon: BookOpen },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Logs', href: '/admin/logs', icon: FileText },
    ],
    support: [
      { label: 'Admin Help', href: '/admin/help', icon: HelpCircle },
      { label: 'Documentation', href: '/admin/docs', icon: BookOpen },
      { label: 'API Reference', href: '/admin/api-docs', icon: FileText },
      { label: 'Support Tickets', href: '/admin/support', icon: Shield },
    ],
    external: [
      { 
        label: 'Back to Main Site', 
        href: '/', 
        icon: ExternalLink,
        external: true 
      },
    ]
  }

  // Get current version and system info
  const systemInfo = {
    version: '2.3.2',
    lastUpdated: 'Sept 26, 2025',
    environment: process.env.NODE_ENV || 'development'
  }

  return (
    <footer 
      className={`
        bg-white border-t border-gray-200 px-6 py-4 mt-auto
        ${className}
      `}
      role="contentinfo"
      aria-label="Admin dashboard footer"
    >
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout */}
        {!isMobile ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* System Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                System
              </h3>
              <ul className="space-y-2">
                {adminLinks.system.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`
                          text-sm flex items-center transition-colors duration-200
                          ${isActive 
                            ? 'text-blue-700 font-medium' 
                            : 'text-gray-600 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className="w-3 h-3 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </h3>
              <ul className="space-y-2">
                {adminLinks.support.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center transition-colors duration-200"
                      >
                        <Icon className="w-3 h-3 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* System Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                System Info
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium min-w-[4rem]">Version:</span>
                  <span className="ml-2">v{systemInfo.version}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="font-medium min-w-[4rem]">Updated:</span>
                  <span className="ml-2">{systemInfo.lastUpdated}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium min-w-[4rem]">Env:</span>
                  <span className={`
                    ml-2 px-2 py-1 rounded-full text-xs font-medium
                    ${systemInfo.environment === 'production' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  `}>
                    {systemInfo.environment}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Navigation
              </h3>
              <ul className="space-y-2">
                {adminLinks.external.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center transition-colors duration-200"
                        {...(link.external && { target: '_self' })}
                      >
                        <Icon className="w-3 h-3 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        ) : (
          /* Mobile Layout */
          <div className="space-y-4">
            {/* Quick Links */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/analytics"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Analytics
              </Link>
              <Link
                href="/admin/settings"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Link>
              <Link
                href="/admin/help"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                Help
              </Link>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Main Site
              </Link>
            </div>

            {/* System Info */}
            <div className="text-center">
              <div className="text-xs text-gray-500">
                NextAccounting Admin v{systemInfo.version} • {systemInfo.environment}
              </div>
            </div>
          </div>
        )}

        {/* Copyright and Branding */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">NextAccounting Admin</span>
              <span className="mx-2">•</span>
              <span>© 2025 NextAccounting. All rights reserved.</span>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center mt-2 md:mt-0">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                <span>System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default AdminFooter