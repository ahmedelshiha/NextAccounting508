'use client'

import Link from 'next/link'
import React from 'react'
import { Settings, Calendar, DollarSign, Users } from 'lucide-react'

import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import { usePermissions } from '@/lib/use-permissions'

export default function SettingsNavigation({ className = '' }: { className?: string }) {
  const pathname = usePathname ? usePathname() : (typeof window !== 'undefined' ? window.location.pathname : '')
  const perms = usePermissions()

  const items = SETTINGS_REGISTRY.filter((c) => {
    if (!c) return false
    // If the category has an explicit permission, honor it. Otherwise show by default.
    // Registry entries may be extended later to include a `permission` property.
    // @ts-ignore
    const required = (c as any).permission as string | undefined
    if (required) return perms.has(required)
    return true
  })

  return (
    <aside className={`settings-navigation w-full ${className}`} aria-label="Settings navigation">
      <div className="sticky top-6 space-y-3">
        <nav className="bg-white border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Settings</h3>
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon as any
              const isActive = pathname === item.route
              return (
                <li key={item.key}>
                  <Link
                    href={item.route}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {Icon ? <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} /> : null}
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="bg-white border rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Quick Links</h4>
          <ul className="text-sm space-y-1">
            <li>
              <a href="/admin/settings/booking" className="text-gray-600 hover:text-gray-800">Booking Settings</a>
            </li>
            <li>
              <a href="/admin/settings/currencies" className="text-gray-600 hover:text-gray-800">Currency Management</a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}
