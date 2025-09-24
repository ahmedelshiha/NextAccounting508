"use client"

import { useMemo, useState } from "react"
import ListPage from "@/components/dashboard/templates/ListPage"
import type { Column, FilterConfig, RowAction } from "@/types/dashboard"
import { useBookings, type BookingsQuery } from "@/hooks/useBookings"

// Lightweight shape for rendering rows in the generic DataTable
interface SRRow {
  id: string
  client?: { name?: string | null; email?: string | null } | null
  service?: { name?: string | null; price?: number | string | null } | null
  status?: string | null
  priority?: string | null
  bookingType?: string | null
  scheduledAt?: string | Date | null
  paymentStatus?: "UNPAID" | "INTENT" | "PAID" | "FAILED" | "REFUNDED" | null
  paymentAmountCents?: number | null
}

const toNumberish = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  if (typeof v === "bigint") return Number(v)
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  try {
    const s = (v as any)?.toString?.()
    if (typeof s === "string") { const n = Number(s); return Number.isFinite(n) ? n : 0 }
  } catch {}
  return 0
}

export default function AdminServiceRequestsPage() {
  const [q, setQ] = useState("")
  const [filters, setFilters] = useState<{ status?: string; priority?: string; bookingType?: string; paymentStatus?: string }>({})
  const [sortBy, setSortBy] = useState<string | undefined>("scheduledAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const params: BookingsQuery = {
    scope: "admin",
    q,
    status: (filters.status as any) || "ALL",
    priority: (filters.priority as any) || "ALL",
    bookingType: (filters.bookingType as any) || "ALL",
    paymentStatus: (filters.paymentStatus as any) || "ALL",
    page: 1,
    limit: 20,
    type: "all",
  }

  const { items, isLoading } = useBookings(params)

  const onFilterChange = (key: string, value: string) => {
    setFilters((p) => ({ ...p, [key]: value || undefined }))
  }

  const filterConfigs: FilterConfig[] = [
    { key: "status", label: "Status", options: [
      { value: "DRAFT", label: "Draft" },
      { value: "SUBMITTED", label: "Submitted" },
      { value: "IN_REVIEW", label: "In Review" },
      { value: "APPROVED", label: "Approved" },
      { value: "ASSIGNED", label: "Assigned" },
      { value: "IN_PROGRESS", label: "In Progress" },
      { value: "COMPLETED", label: "Completed" },
      { value: "CANCELLED", label: "Cancelled" },
    ], value: filters.status },
    { key: "priority", label: "Priority", options: [
      { value: "LOW", label: "Low" },
      { value: "MEDIUM", label: "Medium" },
      { value: "HIGH", label: "High" },
      { value: "URGENT", label: "Urgent" },
    ], value: filters.priority },
    { key: "bookingType", label: "Type", options: [
      { value: "STANDARD", label: "Standard" },
      { value: "RECURRING", label: "Recurring" },
      { value: "EMERGENCY", label: "Emergency" },
      { value: "CONSULTATION", label: "Consultation" },
    ], value: filters.bookingType },
    { key: "paymentStatus", label: "Payment", options: [
      { value: "UNPAID", label: "Unpaid" },
      { value: "INTENT", label: "Intent" },
      { value: "PAID", label: "Paid" },
      { value: "FAILED", label: "Failed" },
      { value: "REFUNDED", label: "Refunded" },
    ], value: filters.paymentStatus },
  ]

  const columns: Column<SRRow>[] = [
    { key: "id", label: "ID", render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0, 6)}</span> },
    { key: "client", label: "Client", sortable: true, render: (_, r) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{r.client?.name || "—"}</span>
        <span className="text-xs text-gray-500">{r.client?.email || "—"}</span>
      </div>
    ) },
    { key: "service", label: "Service", sortable: true, render: (v) => (
      <div className="flex flex-col">
        <span>{(v?.name as string) || "—"}</span>
      </div>
    ) },
    { key: "status", label: "Status", sortable: true },
    { key: "paymentStatus", label: "Payment", render: (v, r) => {
      const cents = (r as any).paymentAmountCents ?? null
      const fromSvc = toNumberish((r.service as any)?.price) * 100
      const amount = cents != null ? cents : (fromSvc || 0)
      return <span className="whitespace-nowrap">{v || "—"}{amount ? ` • $${(amount/100).toFixed(2)}` : ""}</span>
    } },
    { key: "scheduledAt", label: "Date", sortable: true, render: (v, r) => (
      <span>{v ? new Date(v as any).toLocaleString() : (r as any).createdAt ? new Date((r as any).createdAt).toLocaleString() : "—"}</span>
    ) },
  ]

  const actions: RowAction<SRRow>[] = [
    { label: "Open", onClick: (row) => { window.location.href = `/admin/service-requests/${row.id}` } },
  ]

  const rows: SRRow[] = useMemo(() => (items as SRRow[]), [items])

  return (
    <ListPage<SRRow>
      title="Service Requests"
      subtitle="Manage and track service requests and appointments"
      primaryAction={{ label: "New Request", onClick: () => (window.location.href = "/admin/service-requests/new") }}
      secondaryActions={[{ label: "Refresh", onClick: () => window.location.reload() }]}
      filters={filterConfigs}
      onFilterChange={onFilterChange}
      onSearch={(value) => setQ(value)}
      searchPlaceholder="Search clients, services…"
      columns={columns}
      rows={rows}
      loading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(key) => setSortBy(key)}
      actions={actions}
      selectable
    />
  )
}
