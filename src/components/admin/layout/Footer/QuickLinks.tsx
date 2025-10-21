'use client'

/**
 * QuickLinks Component
 * 
 * Renders navigation links to key admin pages (Analytics, Settings, etc.)
 * with icons and support for both internal and external links.
 * 
 * @module @/components/admin/layout/Footer/QuickLinks
 */

import Link from 'next/link'
import {
  BarChart3,
  Settings,
  ExternalLink,
  HelpCircle,
  FileText,
  Code,
} from 'lucide-react'
import { FOOTER_LINKS } from './constants'
import type { QuickLinksProps, FooterLink } from './types'

/**
 * Icon map for dynamic icon lookup
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Settings,
  ExternalLink,
  HelpCircle,
  FileText,
  Code,
}

/**
 * Get icon component by name
 */
function getIcon(iconName: string) {
  return ICON_MAP[iconName] || ExternalLink
}

export function QuickLinks({
  links = FOOTER_LINKS.quickLinks as unknown as FooterLink[],
  compact = false,
}: QuickLinksProps) {
  return (
    <div
      className={`flex gap-${compact ? '2' : '4'}`}
      role="navigation"
      aria-label="Quick links"
    >
      {links.map((link) => {
        const Icon = getIcon(link.icon)
        const isExternal = link.external

        if (isExternal) {
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1"
              title={link.label}
              aria-label={`${link.label} (opens in new window)`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!compact && <span>{link.label}</span>}
            </a>
          )
        }

        return (
          <Link
            key={link.id}
            href={link.href}
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1"
            title={link.label}
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!compact && <span>{link.label}</span>}
          </Link>
        )
      })}
    </div>
  )
}

export default QuickLinks
