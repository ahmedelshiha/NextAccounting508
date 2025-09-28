'use client'

import React from 'react'
import Link from 'next/link'
import type { ActionItem, IconType } from '@/types/dashboard'
import { validateActionItem, devValidateProps } from '@/utils/actionItemValidator'

// Helper to render icon (handles both IconType and ReactNode)
const renderIcon = (icon?: IconType | React.ReactNode) => {
  if (!icon) return null
  
  try {
    // If it's a function (IconType), render it as a component
    if (typeof icon === 'function') {
      const Icon = icon as IconType
      // Validate that it's a proper React component
      if (Icon && typeof Icon === 'function') {
        return <Icon className="w-4 h-4" />
      }
    }
    
    // If it's a valid React element, render it
    if (React.isValidElement(icon)) {
      return icon
    }
    
    // Enhanced validation: detect React component objects (common error #31 cause)
    if (icon && typeof icon === 'object' && '$typeof' in icon) {
      console.error('PageHeader: React component object passed as icon instead of component reference', {
        iconType: typeof icon,
        iconKeys: Object.keys(icon),
        hasRender: 'render' in icon,
        hasDisplayName: 'displayName' in icon,
        icon: icon
      })
      return null
    }
    
    // If it's a string or number, don't render it as an icon
    if (typeof icon === 'string' || typeof icon === 'number') {
      console.warn('PageHeader: String/number passed as icon, expected component or element:', icon)
      return null
    }
    
    // Log unexpected icon types for debugging
    console.warn('PageHeader: Unexpected icon type:', {
      iconType: typeof icon,
      iconConstructor: icon?.constructor?.name,
      icon: icon
    })
    
    // Otherwise, try to render as ReactNode (with caution)
    return icon
  } catch (error) {
    console.error('PageHeader: Error rendering icon:', {
      error: error instanceof Error ? error.message : String(error),
      iconType: typeof icon,
      icon: icon
    })
    return null
  }
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
  // Development-only validation
  React.useEffect(() => {
    devValidateProps({ primaryAction, secondaryActions }, 'PageHeader')
    
    if (primaryAction) {
      const validation = validateActionItem(primaryAction, 'PageHeader.primaryAction')
      if (!validation.isValid) {
        console.error('🚨 PageHeader: Invalid primaryAction:', validation.errors)
      }
    }
    
    secondaryActions.forEach((action, index) => {
      const validation = validateActionItem(action, `PageHeader.secondaryActions[${index}]`)
      if (!validation.isValid) {
        console.error(`🚨 PageHeader: Invalid secondaryAction[${index}]:`, validation.errors)
      }
    })
  }, [primaryAction, secondaryActions])

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
