'use client'

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Calendar, DollarSign, Users } from 'lucide-react'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import { usePermissions } from '@/lib/use-permissions'

export default function SettingsNavigation({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const perms = usePermissions()

  const items = (Array.isArray(SETTINGS_REGISTRY) ? SETTINGS_REGISTRY : []).filter((c) => {
    if (!c) return false

    const catPerm = (c as any).permission as string | string[] | undefined
    if (catPerm) {
      // allow array or single
      if (Array.isArray(catPerm)) return catPerm.some((p) => perms.has(p as any))
      return perms.has(catPerm as any)
    }

    // If no category-level permission, check tabs: if all tabs are restricted and unseen, hide the category
    const tabs = c.tabs ?? []
    if (Array.isArray(tabs) && tabs.length > 0) {
      // visible if at least one tab has no permission or perms.has its permission
      const anyVisible = tabs.some((t: any) => {
        const tp = t.permission as string | string[] | undefined
        if (!tp) return true
        if (Array.isArray(tp)) return tp.some((p) => perms.has(p as any))
        return perms.has(tp as any)
      })
      return anyVisible
    }

    // default to visible
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

        {pathname !== '/admin/settings' && (
          <div className="bg-white border rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Quick Links</h4>
            <ul className="text-sm space-y-1">
              <li>
                <a href="/admin/settings/booking" className="text-gray-600 hover:text-gray-800">Booking Settings</a>
              </li>
              <li>
                <a href="/admin/settings/financial" className="text-gray-600 hover:text-gray-800">Financial Settings</a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}
