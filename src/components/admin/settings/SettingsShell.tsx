'use client'
import React from 'react'
import Link from 'next/link'

type Tab = { key: string; label: string }

export default function SettingsShell({
  title,
  description,
  tabs = [],
  activeTab,
  onChangeTab,
  children
}: {
  title: string
  description?: string
  tabs?: Tab[]
  activeTab?: string
  onChangeTab?: (key: string) => void
  children?: React.ReactNode
}) {
  const handleTabClick = (key: string) => {
    if (onChangeTab) onChangeTab(key)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <aside className="lg:col-span-1">
        <nav className="bg-white border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
          <ul className="space-y-1">
            {tabs.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => handleTabClick(t.key)}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeTab === t.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span className="truncate">{t.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <section className="lg:col-span-4">
        <div className="bg-white border rounded-lg p-6">
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          <div className="settings-content" role="region" aria-label={`${title} settings`}>{children}</div>
        </div>
      </section>
    </div>
  )
}
