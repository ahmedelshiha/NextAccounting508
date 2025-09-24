"use client"

import { useMemo, useState } from "react"
import DataTable from "@/components/dashboard/DataTable"
import type { Column, RowAction } from "@/types/dashboard"

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
  } = props

  const [uncontrolledPage, setUncontrolledPage] = useState(1)
  const page = controlledPage ?? uncontrolledPage
  const pageCount = useMemo(() => Math.max(1, Math.ceil((total ?? rows.length) / pageSize)), [total, rows.length, pageSize])
  const pagedRows = useMemo(() => {
    if (total != null) return rows // server paginated
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize, total])

  const changePage = (next: number) => {
    const n = Math.min(Math.max(1, next), pageCount)
    if (onPageChange) onPageChange(n)
    else setUncontrolledPage(n)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="sticky top-0 z-10">
          {/* Header handled by DataTable */}
        </div>
        <DataTable<T>
          columns={columns}
          rows={pagedRows}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          actions={actions}
          selectable={selectable}
        />
      </div>

      {!loading && pagedRows.length === 0 && (
        <div className="p-6 text-center text-gray-600">{emptyMessage}</div>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
        <div className="text-sm text-gray-600">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 text-sm rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            onClick={() => changePage(page + 1)}
            disabled={page >= pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
