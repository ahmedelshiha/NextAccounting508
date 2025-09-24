"use client"

import PageHeader from "@/components/dashboard/PageHeader"
import PrimaryTabs from "@/components/dashboard/PrimaryTabs"
import SecondaryTabs from "@/components/dashboard/SecondaryTabs"
import FilterBar from "@/components/dashboard/FilterBar"
import type { ActionItem, FilterConfig, TabItem } from "@/types/dashboard"
import { ReactNode } from "react"

interface StandardPageProps {
  title: string
  subtitle?: string
  primaryAction?: ActionItem
  secondaryActions?: ActionItem[]
  primaryTabs?: TabItem[]
  activePrimaryTab?: string
  onPrimaryTabChange?: (key: string) => void
  secondaryTabs?: TabItem[]
  activeSecondaryTab?: string
  onSecondaryTabChange?: (key: string) => void
  filters?: FilterConfig[]
  activeFilters?: Array<{ key: string; label: string; value: string }>
  onFilterChange?: (key: string, value: string) => void
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  loading?: boolean
  error?: string | null
  children: ReactNode
}

/**
 * StandardPage provides a consistent admin workspace container:
 * - Header with title, subtitle and actions
 * - Optional primary and secondary tabs
 * - Optional search + filters bar
 * - Loading and error UI states
 * - Content area for page-specific components
 */
export default function StandardPage({
  title,
  subtitle,
  primaryAction,
  secondaryActions = [],
  primaryTabs = [],
  activePrimaryTab = primaryTabs[0]?.key ?? "",
  onPrimaryTabChange,
  secondaryTabs = [],
  activeSecondaryTab = secondaryTabs[0]?.key ?? "",
  onSecondaryTabChange,
  filters = [],
  activeFilters = [],
  onFilterChange,
  onSearch,
  searchPlaceholder,
  loading,
  error,
  children,
}: StandardPageProps) {
  return (
    <div className="-mt-4 -mx-6 px-6">
      <PageHeader title={title} subtitle={subtitle} primaryAction={primaryAction} secondaryActions={secondaryActions} />

      {primaryTabs.length > 0 && onPrimaryTabChange && (
        <PrimaryTabs tabs={primaryTabs} active={activePrimaryTab} onChange={onPrimaryTabChange} />
      )}

      <div className="flex items-center justify-between mb-4">
        {secondaryTabs.length > 0 && onSecondaryTabChange && (
          <SecondaryTabs tabs={secondaryTabs} active={activeSecondaryTab} onChange={onSecondaryTabChange} />
        )}
      </div>

      {(onSearch || (filters && filters.length > 0)) && (
        <FilterBar
          filters={filters}
          onFilterChange={(k, v) => onFilterChange?.(k, v)}
          onSearch={onSearch}
          active={activeFilters}
          searchPlaceholder={searchPlaceholder}
        />
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
            <span>Loading…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="pb-8">{children}</div>
    </div>
  )
}
