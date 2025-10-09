"use client"

'use client'

import { useEffect, useMemo, useState } from "react"
import DataTable from "@/components/dashboard/DataTable"
import type { Column, RowAction } from "@/types/dashboard"

/**
 * Props for AdvancedDataTable. When `total` is provided, the component assumes
 * server-side pagination (rows already paged by the caller). Otherwise, it
 * performs client-side pagination based on `pageSize`.
 */
interface AdvancedDataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
  actions?: RowAction<T>[]
  selectable?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  emptyMessage?: string
  onSelectionChange?: (ids: Array<string | number>) => void
}

/**
 * AdvancedDataTable wraps DataTable with sticky headers and simple pagination.
 * It preserves existing visual style and green accents while improving UX for long lists.
 */
export default function AdvancedDataTable<T extends { id?: string | number }>(props: AdvancedDataTableProps<T>) {
  const {
    columns,
    rows,
    loading,
    sortBy,
    sortOrder,
    onSort,
    actions,
    selectable = true,
    page: controlledPage,
    pageSize = 20,
    total,
    onPageChange,
    emptyMessage = 'No records found',
    onSelectionChange,
  } = props

  const [uncontrolledPage, setUncontrolledPage] = useState(1)
  const [internalSortKey, setInternalSortKey] = useState<string | undefined>(() => (onSort ? undefined : sortBy))
  const [internalSortOrder, setInternalSortOrder] = useState<"asc" | "desc">(sortOrder ?? "asc")

  useEffect(() => {
    if (onSort) return
    setInternalSortKey(sortBy)
  }, [sortBy, onSort])

  useEffect(() => {
    if (onSort || !sortOrder) return
    setInternalSortOrder(sortOrder)
  }, [sortOrder, onSort])

  const collator = useMemo(() => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }), [])

  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key)
      return
    }

    setInternalSortKey((currentKey) => {
      if (currentKey === key) {
        setInternalSortOrder((currentOrder) => (currentOrder === "asc" ? "desc" : "asc"))
        return currentKey
      }

      setInternalSortOrder("asc")
      return key
    })
  }

  const sortedRows = useMemo(() => {
    if (onSort || total != null || !internalSortKey) {
      return rows
    }

    const direction = internalSortOrder === "desc" ? -1 : 1

    return [...rows].sort((a, b) => {
      const valueA = (a as Record<string, unknown>)[internalSortKey]
      const valueB = (b as Record<string, unknown>)[internalSortKey]

      if (valueA == null && valueB == null) return 0
      if (valueA == null) return -1 * direction
      if (valueB == null) return 1 * direction

      if (typeof valueA === "number" && typeof valueB === "number") {
        return (valueA - valueB) * direction
      }

      return collator.compare(String(valueA), String(valueB)) * direction
    })
  }, [rows, onSort, total, internalSortKey, internalSortOrder, collator])

  const effectiveRows = total != null ? rows : sortedRows

  const page = controlledPage ?? uncontrolledPage
  const pageCount = useMemo(() => Math.max(1, Math.ceil((total ?? rows.length) / pageSize)), [total, rows.length, pageSize])

  // If `total` is provided we assume rows are already sliced server-side; otherwise do client-side slicing
  const pagedRows = useMemo(() => {
    if (total != null) return rows // server paginated
    const start = (page - 1) * pageSize
    return effectiveRows.slice(start, start + pageSize)
  }, [effectiveRows, page, pageSize, total, rows])

  const effectiveSortBy = onSort ? sortBy : internalSortKey
  const effectiveSortOrder = onSort ? (sortOrder ?? "asc") : internalSortOrder

  const changePage = (next: number) => {
    const n = Math.min(Math.max(1, next), pageCount)
    if (onPageChange) onPageChange(n)
    else setUncontrolledPage(n)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="sticky top-0 z-10"></div>
        <DataTable<T>
          columns={columns}
          rows={pagedRows}
          loading={loading}
          sortBy={effectiveSortBy}
          sortOrder={effectiveSortOrder}
          onSort={handleSort}
          actions={actions}
          selectable={selectable}
          onSelectionChange={onSelectionChange}
        />
      </div>

      {!loading && pagedRows.length === 0 && (
        <div className="p-6 text-center text-gray-600">{emptyMessage}</div>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t" role="navigation" aria-label="Pagination">
        <div className="text-sm text-gray-600">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <button
            className="px-3 py-1 text-sm rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            onClick={() => changePage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
