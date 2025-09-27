'use client'

import React from 'react'
import Link from 'next/link'
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

// Helper to render action button
const renderActionButton = (action: ActionItem, isPrimary: boolean = false) => {
  const baseClasses = "px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
  const primaryClasses = "text-white bg-green-600 hover:bg-green-700"
  const secondaryClasses = "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
  const classes = `${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses}`
  
  const content = (
    <>
      {renderIcon(action.icon)}
      {action.label}
    </>
  )
  
  // If href is provided, render as Link
  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {content}
      </Link>
    )
  }
  
  // Otherwise render as button with onClick
  return (
    <button onClick={action.onClick} className={classes} disabled={action.disabled}>
      {content}
    </button>
  )
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
          {secondaryActions.map((action, i) => (
            <React.Fragment key={i}>
              {renderActionButton(action, false)}
            </React.Fragment>
          ))}
          {primaryAction && renderActionButton(primaryAction, true)}
        </div>
      </div>
    </div>
  )
}
