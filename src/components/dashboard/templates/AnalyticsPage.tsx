"use client"

import StandardPage from "./StandardPage"
import ProfessionalKPIGrid, { KPIStatsProps } from "@/components/dashboard/analytics/ProfessionalKPIGrid"
import RevenueTrendChart from "@/components/dashboard/analytics/RevenueTrendChart"
import type { ActionItem, FilterConfig, TabItem } from "@/types/dashboard"
import type * as React from "react"

/**
 * Props for AnalyticsPage which composes KPI grid and optional charts
 * within the StandardPage workspace shell.
 */
interface AnalyticsPageProps extends KPIStatsProps {
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
  onFilterChange?: (key: string, value: string) => void
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  loading?: boolean
  error?: string | null
  /** Monthly trend data for the revenue line chart */
  revenueTrend?: Array<{ month: string; revenue: number; target?: number }>
  /** Optional extra charts/sections */
  children?: React.ReactNode
}

/**
 * AnalyticsPage composes StandardPage with KPI grid and charts.
 * Provide stats and optional trend data; additional charts can be slotted as children.
 */
export default function AnalyticsPage(props: AnalyticsPageProps) {
  const {
    title,
    subtitle,
    primaryAction,
    secondaryActions,
    primaryTabs,
    activePrimaryTab,
    onPrimaryTabChange,
    secondaryTabs,
    activeSecondaryTab,
    onSecondaryTabChange,
    filters,
    onFilterChange,
    onSearch,
    searchPlaceholder,
    loading,
    error,
    stats,
    revenueTrend,
    children,
  } = props

  return (
    <StandardPage
      title={title}
      subtitle={subtitle}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      primaryTabs={primaryTabs}
      activePrimaryTab={activePrimaryTab}
      onPrimaryTabChange={onPrimaryTabChange}
      secondaryTabs={secondaryTabs}
      activeSecondaryTab={activeSecondaryTab}
      onSecondaryTabChange={onSecondaryTabChange}
      filters={filters}
      onFilterChange={onFilterChange}
      onSearch={onSearch}
      searchPlaceholder={searchPlaceholder}
      loading={loading}
      error={error}
    >
      <ProfessionalKPIGrid stats={stats} />

      {revenueTrend && revenueTrend.length > 0 && (
        <div className="mt-6">
          <RevenueTrendChart data={revenueTrend} />
        </div>
      )}

      {children}
    </StandardPage>
  )
}
