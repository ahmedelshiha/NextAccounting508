'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import { hasPermission } from '@/lib/permissions'
import useRovingTabIndex from '@/hooks/useRovingTabIndex'

const GROUP_ORDER = ['platform', 'business', 'operations', 'financial', 'security', 'integrations'] as const
const GROUP_LABELS: Record<string, string> = {
  platform: 'Platform',
  business: 'Business',
  operations: 'Operations',
  financial: 'Financial',
  security: 'Security',
  integrations: 'Integrations',
}

export default function SettingsNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const { setContainer, handleKeyDown } = useRovingTabIndex()

  const visible = SETTINGS_REGISTRY.filter((c) => {
    if (!c.permission) return true
    return hasPermission(role, c.permission as any)
  })

  // Sort by group, then by numeric order; fallback stable by label
  const sorted = [...visible].sort((a, b) => {
    const ga = a.group || 'platform'
    const gb = b.group || 'platform'
    const gi = GROUP_ORDER.indexOf(ga as any)
    const gj = GROUP_ORDER.indexOf(gb as any)
    if (gi !== gj) return gi - gj
    const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
    const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    return a.label.localeCompare(b.label)
  })

  // Group by group key
  const groups = sorted.reduce<Record<string, typeof sorted>>((acc, item) => {
    const key = item.group || 'platform'
    if (!acc[key]) acc[key] = [] as any
    acc[key].push(item)
    return acc
  }, {})

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="md:sticky md:top-20 h-max">
      <nav
        className="bg-white border rounded-lg p-3"
        aria-label="Settings navigation"
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Settings</h3>
        <div
          ref={setContainer as any}
          onKeyDown={(e) => (handleKeyDown as any)(e.nativeEvent)}
          role="menu"
          aria-orientation="vertical"
        >
          {GROUP_ORDER.filter((g) => groups[g]?.length).map((groupKey) => (
            <section key={groupKey} className="mb-3 last:mb-0">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 mb-1">
                {GROUP_LABELS[groupKey] || groupKey}
              </h4>
              <ul className="space-y-1">
                {groups[groupKey]!.map((item) => {
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
                        data-roving
                        tabIndex={0}
                        role="menuitem"
                      >
                        <span className="flex items-center">
                          {Icon ? (
                            <Icon className={`h-4 w-4 mr-2 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                          ) : null}
                          <span className="text-sm">{item.label}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>
    </aside>
  )
}
