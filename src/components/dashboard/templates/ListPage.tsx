"use client"

import StandardPage from "./StandardPage"
import DataTable from "@/components/dashboard/DataTable"
import AdvancedDataTable from "@/components/dashboard/tables/AdvancedDataTable"
import type { ActionItem, Column, FilterConfig, RowAction, TabItem } from "@/types/dashboard"
import { ReactNode, useMemo, useState } from "react"

interface ListPageProps<T extends { id?: string | number }> {
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
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
  actions?: RowAction<T>[]
  selectable?: boolean
  /** Optional render prop to show custom bulk actions when selection is non-empty */
  renderBulkActions?: (selectedIds: Array<string | number>) => ReactNode
  /** Use AdvancedDataTable (adds sticky header + pagination UI) */
  useAdvancedTable?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  emptyMessage?: string
}

/**
 * ListPage composes StandardPage with DataTable to create a reusable list view.
 * It supports selection, sorting, filters, search and custom bulk actions.
 */
export default function ListPage<T extends { id?: string | number }>(props: ListPageProps<T>) {
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
    columns,
    rows,
    loading,
    sortBy,
    sortOrder,
    onSort,
    actions,
    selectable = true,
    renderBulkActions,
    useAdvancedTable = false,
    page,
    pageSize,
    total,
    onPageChange,
    emptyMessage,
  } = props

  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const activeFilters = useMemo(() => (filters || []).filter((f) => f.value).map((f) => ({ key: f.key, label: f.label, value: String(f.value) })), [filters])

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
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      onSearch={onSearch}
      searchPlaceholder={searchPlaceholder}
      loading={loading}
    >
      {renderBulkActions && selectedIds.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">{renderBulkActions(selectedIds)}</div>
      )}

      {useAdvancedTable ? (
        <AdvancedDataTable<T>
          columns={columns}
          rows={rows}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          actions={actions}
          selectable={selectable}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          emptyMessage={emptyMessage}
        />
      ) : (
        <DataTable<T>
          columns={columns}
          rows={rows}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          actions={actions}
          selectable={selectable}
          onSelectionChange={setSelectedIds}
        />
      )}
    </StandardPage>
  )
}
