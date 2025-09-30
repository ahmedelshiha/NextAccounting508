'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SETTINGS_REGISTRY } from '@/lib/settings/registry'
import { hasPermission } from '@/lib/permissions'

export default function SettingsNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const items = SETTINGS_REGISTRY.filter((c) => {
    if (!c.permission) return true
    return hasPermission(role, c.permission as any)
  })

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="md:sticky md:top-20 h-max">
      <nav className="bg-white border rounded-lg p-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Settings</h3>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActive(item.route)
            const Icon = item.icon as any
            return (
              <li key={item.key}>
                <Link
                  href={item.route}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between px-2 py-2 rounded transition-colors ${
                    active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center">
                    {Icon ? <Icon className={`h-4 w-4 mr-2 ${active ? 'text-blue-600' : 'text-gray-400'}`} /> : null}
                    <span className="text-sm">{item.label}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
