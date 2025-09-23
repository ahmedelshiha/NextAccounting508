'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, UserCheck, Calendar, Briefcase, Clock, FileText, CreditCard, DollarSign, BarChart3, Shield, Settings, Bell, Zap, Plus, ChevronDown
} from 'lucide-react'
import type { NavGroup } from '@/types/dashboard'

export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(['Clients', 'Bookings'])

  const groups: NavGroup[] = [
    { label: 'Dashboard', items: [
      { label: 'Overview', href: '/admin', icon: Home },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ]},
    { label: 'Clients', items: [
      { label: 'Client List', href: '/admin/users', icon: Users },
      { label: 'Invitations', href: '/admin/clients/invitations', icon: UserCheck, badge: '3' },
      { label: 'Profiles', href: '/admin/clients/profiles', icon: Users },
    ]},
    { label: 'Bookings', items: [
      { label: 'Appointments', href: '/admin/bookings', icon: Calendar, badge: '12' },
      { label: 'Services', href: '/admin/services', icon: Briefcase },
      { label: 'Availability', href: '/admin/availability', icon: Clock },
      { label: 'Booking Settings', href: '/admin/settings/booking', icon: Settings },
      { label: 'Service Requests', href: '/admin/service-requests', icon: FileText, badge: '5' },
    ]},
    { label: 'Accounting', items: [
      { label: 'Invoices', href: '/admin/invoices', icon: FileText },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Expenses', href: '/admin/expenses', icon: DollarSign },
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { label: 'Taxes', href: '/admin/taxes', icon: Clock },
    ]},
    { label: 'Team', items: [
      { label: 'Staff', href: '/admin/team', icon: Users },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Permissions', href: '/admin/permissions', icon: Shield },
    ]},
    { label: 'System', items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Integrations', href: '/admin/integrations', icon: Zap },
    ]},
  ]

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))
  const toggle = (k: string) => setExpanded((p) => (p.includes(k) ? p.filter((g) => g !== k) : [...p, k]))

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg grid place-items-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
            <p className="text-xs text-gray-500">Accounting & Bookings</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="font-medium">New</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-1">
          {groups.map((group) => {
            const isDash = group.label === 'Dashboard'
            const isOpen = isDash || expanded.includes(group.label)
            return (
              <div key={group.label}>
                {!isDash && (
                  <button onClick={() => toggle(group.label)} className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                    <span>{group.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {isOpen && (
                  <div className={isDash ? 'space-y-1' : 'ml-3 mt-1 space-y-1'}>
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      const Icon = item.icon
                      return (
                        <Link key={item.href} href={item.href} className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 mr-3" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">{item.badge}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          <span>Operational</span>
        </div>
      </div>
    </div>
  )
}
