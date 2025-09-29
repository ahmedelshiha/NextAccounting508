'use client'

import Link from 'next/link'
import React from 'react'
import { Settings, Calendar, DollarSign, Users } from 'lucide-react'

const navItems = [
  { key: 'general', label: 'General', href: '/admin/settings', icon: Settings },
  { key: 'company', label: 'Company', href: '/admin/settings/company', icon: Users },
  { key: 'contact', label: 'Contact', href: '/admin/settings/contact', icon: Users },
  { key: 'timezone', label: 'Timezone & Localization', href: '/admin/settings/timezone', icon: Calendar },
  { key: 'financial', label: 'Financial', href: '/admin/settings/financial', icon: DollarSign },
]

export default function SettingsNavigation({ className = '' }: { className?: string }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <aside className={`settings-navigation w-full ${className}`} aria-label="Settings navigation">
      <div className="sticky top-6 space-y-3">
        <nav className="bg-white border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Settings</h3>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon as any
              const isActive = pathname === item.href
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
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
