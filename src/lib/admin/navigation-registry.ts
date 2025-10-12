import type { ComponentType } from 'react'
import {
  BarChart3,
  Calendar,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Receipt,
  CheckSquare,
  TrendingUp,
  Settings as SettingsIcon,
  UserCog,
  Shield,
  Upload,
  Bell,
  Mail,
  HelpCircle,
  Home,
  DollarSign,
  Clock,
  Target,
  Building,
  Zap,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export type IconType = ComponentType<{ className?: string }>

export interface NavItemMeta {
  id: string
  label: string
  href: string
  icon: IconType
  permission?: string
  badgeKey?: string
  keywords?: string[]
  description?: string
  children?: NavItemMeta[]
}

export interface NavSection {
  key: string
  items: NavItemMeta[]
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    key: 'dashboard',
    items: [
      { id: 'overview', label: 'Overview', href: '/admin', icon: Home },
      { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW, keywords: ['reports','charts','metrics'] },
      { id: 'reports', label: 'Reports', href: '/admin/reports', icon: TrendingUp, permission: PERMISSIONS.ANALYTICS_VIEW },
    ],
  },
  {
    key: 'business',
    items: [
      {
        id: 'bookings',
        label: 'Bookings',
        href: '/admin/bookings',
        icon: Calendar,
        badgeKey: 'pendingBookings',
        children: [
          { id: 'bookings_all', label: 'All Bookings', href: '/admin/bookings', icon: Calendar },
          { id: 'calendar', label: 'Calendar View', href: '/admin/calendar', icon: Calendar },
          { id: 'availability', label: 'Availability', href: '/admin/availability', icon: Clock },
          { id: 'bookings_new', label: 'New Booking', href: '/admin/bookings/new', icon: Calendar },
        ],
      },
      {
        id: 'clients',
        label: 'Clients',
        href: '/admin/clients',
        icon: Users,
        badgeKey: 'newClients',
        children: [
          { id: 'clients_all', label: 'All Clients', href: '/admin/clients', icon: Users },
          { id: 'profiles', label: 'Profiles', href: '/admin/clients/profiles', icon: Users },
          { id: 'invitations', label: 'Invitations', href: '/admin/clients/invitations', icon: Mail },
          { id: 'clients_new', label: 'Add Client', href: '/admin/clients/new', icon: Users },
        ],
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/services',
        icon: Briefcase,
        permission: PERMISSIONS.SERVICES_VIEW,
        children: [
          { id: 'services_all', label: 'All Services', href: '/admin/services', icon: Briefcase },
          { id: 'services_categories', label: 'Categories', href: '/admin/services/categories', icon: Target },
          { id: 'services_analytics', label: 'Analytics', href: '/admin/services/analytics', icon: BarChart3 },
        ],
      },
      {
        id: 'service_requests',
        label: 'Service Requests',
        href: '/admin/service-requests',
        icon: FileText,
        permission: PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
        badgeKey: 'pendingServiceRequests',
      },
    ],
  },
  {
    key: 'financial',
    items: [
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/admin/invoices',
        icon: FileText,
        keywords: ['billing','invoice','finance'],
        children: [
          { id: 'invoices_all', label: 'All Invoices', href: '/admin/invoices', icon: FileText },
          { id: 'invoices_sequences', label: 'Sequences', href: '/admin/invoices/sequences', icon: FileText },
          // NOTE: Removed stale "Templates" link as there is no /admin/invoices/templates page
        ],
      },
      { id: 'payments', label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { id: 'expenses', label: 'Expenses', href: '/admin/expenses', icon: Receipt },
      { id: 'taxes', label: 'Taxes', href: '/admin/taxes', icon: DollarSign },
    ],
  },
  {
    key: 'operations',
    items: [
      { id: 'tasks', label: 'Tasks', href: '/admin/tasks', icon: CheckSquare, permission: PERMISSIONS.TASKS_READ_ALL, badgeKey: 'overdueTasks' },
      { id: 'team', label: 'Team', href: '/admin/team', icon: UserCog, permission: PERMISSIONS.TEAM_VIEW },
      { id: 'chat', label: 'Chat', href: '/admin/chat', icon: Mail },
      { id: 'reminders', label: 'Reminders', href: '/admin/reminders', icon: Bell },
    ],
  },
  {
    key: 'system',
    items: [
      { id: 'settings', label: 'Settings', href: '/admin/settings', icon: SettingsIcon, children: [] },
      { id: 'cron_telemetry', label: 'Cron Telemetry', href: '/admin/cron-telemetry', icon: Zap },
    ],
  },
]

export function getNavigation(params: { userRole?: string | null; counts?: Record<string, number | string | undefined> | null }) {
  const { userRole, counts } = params

  const allow = (perm?: string) => {
    if (!perm) return true
    return hasPermission(userRole, perm as any)
  }

  const mapItem = (item: NavItemMeta): NavItemMeta => {
    const badge = item.badgeKey ? (counts?.[item.badgeKey] as any) : undefined
    const children = item.children?.filter(chi => allow(chi.permission)).map(mapItem)
    return {
      ...item,
      // attach runtime-resolved badge as string|number if present
      ...(badge ? { badgeKey: item.badgeKey } : {}),
      ...(children ? { children } : {}),
    }
  }

  return NAVIGATION_SECTIONS.map(section => ({
    key: section.key,
    items: section.items.filter(i => allow(i.permission)).map(mapItem),
  }))
}

// Build a simple search index from the registry
export type NavItemSearch = { href: string; label: string; section: string; keywords?: string[] }
export function buildSearchIndex(): NavItemSearch[] {
  const out: NavItemSearch[] = []
  for (const section of NAVIGATION_SECTIONS) {
    for (const item of section.items) {
      out.push({ href: item.href, label: item.label, section: section.key, keywords: item.keywords })
      if (item.children) {
        for (const c of item.children) {
          out.push({ href: c.href, label: c.label, section: section.key, keywords: c.keywords })
        }
      }
    }
  }
  return out
}

export function searchNav(query: string, limit = 5): NavItemSearch[] {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  const idx = buildSearchIndex()
  const scored: Array<{ s: number; item: NavItemSearch }> = []
  for (const it of idx) {
    const label = it.label.toLowerCase()
    const kws = (it.keywords || []).map(k => k.toLowerCase())
    let score = Number.POSITIVE_INFINITY
    if (label === q) score = 0
    else if (label.startsWith(q)) score = 0.25
    else if (label.includes(q)) score = 0.5
    else if (kws.some(k => k === q)) score = 0.6
    else if (kws.some(k => k.includes(q))) score = 0.8
    if (Number.isFinite(score)) scored.push({ s: score, item: it })
  }
  scored.sort((a, b) => a.s - b.s || a.item.label.localeCompare(b.item.label))
  return scored.slice(0, limit).map(x => x.item)
}

// Flatten registry into a list of items including children
export function flattenNavigation(sections: NavSection[] = NAVIGATION_SECTIONS): NavItemMeta[] {
  const out: NavItemMeta[] = []
  const walk = (items?: NavItemMeta[]) => {
    if (!items) return
    for (const it of items) {
      out.push(it)
      if (it.children && it.children.length) walk(it.children)
    }
  }
  for (const s of sections) walk(s.items)
  return out
}

// Build breadcrumbs for a given pathname using registry labels; fallback to title-cased segments
export function getBreadcrumbs(pathname: string): Array<{ href: string; label: string }> {
  try {
    const segments = pathname.split('/').filter(Boolean)
    const prefixes: string[] = []
    for (let i = 0; i < segments.length; i++) {
      const href = '/' + segments.slice(0, i + 1).join('/')
      prefixes.push(href)
    }

    const items = flattenNavigation()
    const labelFor = (href: string): string | null => {
      const found = items.find(it => it.href === href)
      return found ? found.label : null
    }

    const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')

    const crumbs: Array<{ href: string; label: string }> = []
    for (const href of prefixes) {
      const reg = labelFor(href)
      if (reg) {
        crumbs.push({ href, label: reg })
      } else {
        const last = href.split('/').filter(Boolean).pop() || ''
        if (last) crumbs.push({ href, label: titleCase(last) })
      }
    }
    return crumbs
  } catch {
    return []
  }
}
