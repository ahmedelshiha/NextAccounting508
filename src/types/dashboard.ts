import { ReactNode } from 'react'

// Core icon type for lucide-react icons or custom SVGs
export type IconType = React.ComponentType<{ className?: string }>

import type { ReactNode } from 'react'
import type { Permission } from '@/lib/permissions'

// Navigation
export interface NavItem {
  label: string
  href: string
  icon: IconType
  badge?: string | number
  permission?: Permission
  exact?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  permission?: Permission
}

// Tabs (primary/secondary)
export interface TabItem {
  key: string
  label: string
  count?: number | null
}

// Filters
export interface FilterOption { value: string; label: string }
export interface FilterConfig { key: string; label: string; options: FilterOption[]; value?: string }

// Header action items
export interface ActionItem { label: string; icon?: ReactNode; onClick: () => void }

// Tables
export type Align = 'left' | 'center' | 'right'
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  align?: Align
  render?: (value: any, row: T) => ReactNode
}

export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
}
