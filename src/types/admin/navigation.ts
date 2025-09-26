/**
 * Navigation Types for Admin Dashboard
 * Comprehensive type definitions for hierarchical navigation system
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

/**
 * Core navigation item interface supporting hierarchical navigation
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string
  
  /** Display title shown in navigation */
  title: string
  
  /** URL path for navigation (optional for parent items) */
  href?: string
  
  /** Lucide icon component for visual representation */
  icon: LucideIcon
  
  /** Optional badge text or number for notifications/counts */
  badge?: string | number
  
  /** Child navigation items for hierarchical structure */
  children?: NavigationItem[]
  
  /** Required permissions to access this item */
  permissions?: string[]
  
  /** Whether this link opens externally */
  external?: boolean
  
  /** Exact path matching (default: false for prefix matching) */
  exact?: boolean
  
  /** Optional description for tooltips/accessibility */
  description?: string
  
  /** Whether this item is disabled */
  disabled?: boolean
  
  /** Custom styling classes */
  className?: string
}

/**
 * Navigation group for organizing related navigation items
 */
export interface NavigationGroup {
  /** Unique identifier for the group */
  id: string
  
  /** Display label for the group */
  label: string
  
  /** Items within this group */
  items: NavigationItem[]
  
  /** Required permissions to see this group */
  permission?: string
  
  /** Whether this group is collapsible */
  collapsible?: boolean
  
  /** Default collapsed state */
  defaultCollapsed?: boolean
  
  /** Group icon */
  icon?: LucideIcon
  
  /** Group order priority */
  order?: number
}

/**
 * Breadcrumb item for navigation trails
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string
  
  /** Navigation href */
  href: string
  
  /** Optional icon */
  icon?: LucideIcon
  
  /** Whether this is the last/current item */
  isLast?: boolean
}

/**
 * Search result interface for global search
 */
export interface SearchResult {
  /** Result ID */
  id: string
  
  /** Title/name of the result */
  title: string
  
  /** Description or subtitle */
  description?: string
  
  /** Navigation URL */
  href: string
  
  /** Result type (page, client, booking, etc.) */
  type: SearchResultType
  
  /** Optional icon */
  icon?: LucideIcon
  
  /** Highlighted search matches */
  matches?: SearchMatch[]
}

/**
 * Search result types for categorization
 */
export type SearchResultType = 
  | 'page'
  | 'client' 
  | 'booking'
  | 'service-request'
  | 'invoice'
  | 'user'
  | 'report'
  | 'setting'

/**
 * Search match highlighting
 */
export interface SearchMatch {
  /** Matched text */
  text: string
  
  /** Field that was matched */
  field: string
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Action ID */
  id: string
  
  /** Display label */
  label: string
  
  /** Action icon */
  icon: LucideIcon
  
  /** Click handler or href */
  action: (() => void) | string
  
  /** Required permissions */
  permissions?: string[]
  
  /** Keyboard shortcut */
  shortcut?: string
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
}

/**
 * Notification item for notification center
 */
export interface NotificationItem {
  /** Notification ID */
  id: string
  
  /** Notification title */
  title: string
  
  /** Notification message */
  message: string
  
  /** Notification type */
  type: NotificationType
  
  /** Whether notification is read */
  read: boolean
  
  /** Creation timestamp */
  createdAt: Date
  
  /** Optional action URL */
  href?: string
  
  /** Optional icon override */
  icon?: LucideIcon
}

/**
 * Notification types with different styling
 */
export type NotificationType = 
  | 'info'
  | 'success' 
  | 'warning'
  | 'error'
  | 'booking'
  | 'payment'
  | 'system'

/**
 * User profile section data
 */
export interface UserProfile {
  /** User ID */
  id: string
  
  /** Display name */
  name: string
  
  /** Email address */
  email: string
  
  /** User role */
  role: string
  
  /** Profile image URL */
  avatar?: string
  
  /** Last login timestamp */
  lastLogin?: Date
  
  /** User permissions */
  permissions: string[]
}