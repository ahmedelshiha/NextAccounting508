export type TableColumn<Row = any> = {
  key: string
  label: string
  render?: (row: Row) => React.ReactNode
  sortable?: boolean
  width?: string | number
}

export type AdvancedDataTableProps<Row = any> = {
  columns: TableColumn<Row>[]
  data: Row[]
  total: number
  page: number
  pageSize: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSortChange?: (opts: { sortBy: string; sortOrder: 'asc' | 'desc' }) => void
  onSelectionChange?: (selectedIds: string[]) => void
  onExport?: (opts?: any) => void
  emptyState?: React.ReactNode
}

export default TableColumn;
