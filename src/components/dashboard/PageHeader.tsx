'use client'

import React from 'react'
import type { ActionItem, IconType } from '@/types/dashboard'

// Helper to render icon (handles both IconType and ReactNode)
const renderIcon = (icon?: IconType | React.ReactNode) => {
  if (!icon) return null
  
  // If it's a function (IconType), render it as a component
  if (typeof icon === 'function') {
    const Icon = icon as IconType
    return <Icon className="w-4 h-4" />
  }
  
  // Otherwise, render as ReactNode
  return icon
}

export default function PageHeader({ title, subtitle, primaryAction, secondaryActions = [] }: { title: string; subtitle?: string; primaryAction?: ActionItem; secondaryActions?: ActionItem[] }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6 -mx-6 -mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {secondaryActions.map((a, i) => (
            <button key={i} onClick={a.onClick} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              {renderIcon(a.icon)}
              {a.label}
            </button>
          ))}
          {primaryAction && (
            <button onClick={primaryAction.onClick} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
              {renderIcon(primaryAction.icon)}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
