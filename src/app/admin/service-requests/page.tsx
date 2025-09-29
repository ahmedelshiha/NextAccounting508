"use client"

import { useMemo, useState, useEffect } from "react"
import ListPage from "@/components/dashboard/templates/ListPage"
import type { Column, FilterConfig, RowAction } from "@/types/dashboard"
import { useServiceRequests, type ServiceRequestsQuery } from "@/hooks/useServiceRequests"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ServiceRequestsBulkActions from '@/components/admin/service-requests/bulk-actions'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  ArrowRight,
  Plus
} from "lucide-react"

// Service Request row interface
interface ServiceRequestRow {
  id: string
  title?: string | null
  client?: { 
    id: string
    name?: string | null
    email?: string | null
  } | null
  service?: { 
    id: string
    name?: string | null
    category?: string | null
    slug?: string | null
  } | null
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTeamMember?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
  budgetMin?: number | null
  budgetMax?: number | null
  deadline?: string | null
  createdAt: string
  updatedAt?: string | null
  isBooking?: boolean
  scheduledAt?: string | null
}

export default function AdminServiceRequestsPage() {
  const [q, setQ] = useState("")
  const [filters, setFilters] = useState<{ 
    status?: string
    priority?: string
    assignedTo?: string
  }>({})
  const [sortBy, setSortBy] = useState<string | undefined>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const params: ServiceRequestsQuery = {
    scope: "admin",
    q,
    status: (filters.status as any) || "ALL",
    priority: (filters.priority as any) || "ALL",
    assignedTo: filters.assignedTo || undefined,
    page: 1,
    limit: 20,
    sortBy,
    sortOrder,
  }

  const { items, isLoading, error, refresh } = useServiceRequests(params)

  const onFilterChange = (key: string, value: string) => {
    setFilters((p) => ({ ...p, [key]: value || undefined }))
  }

  useEffect(() => {
    if (error) {
      (async () => {
        const { toastError } = await import('@/lib/toast-api')
        toastError(error, 'Failed to load service requests')
      })()
    }
  }, [error])

  // Professional status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Clock },
      SUBMITTED: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
      IN_REVIEW: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      APPROVED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      ASSIGNED: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Users },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border flex items-center gap-1 text-xs`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  // Professional priority badge component
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { color: 'bg-gray-100 text-gray-600', icon: null },
      MEDIUM: { color: 'bg-blue-100 text-blue-600', icon: null },
      HIGH: { color: 'bg-orange-100 text-orange-600', icon: AlertTriangle },
      URGENT: { color: 'bg-red-100 text-red-600', icon: AlertTriangle }
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
        {Icon && <Icon className="w-3 h-3" />}
        {priority.charAt(0) + priority.slice(1).toLowerCase()}
      </Badge>
    )
  }

  // Format currency helper
  const formatCurrency = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()}`
    }
    if (min) return `${min.toLocaleString()}+`
    if (max) return `Up to ${max.toLocaleString()}`
    return 'TBD'
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filterConfigs: FilterConfig[] = [
    { 
      key: "status", 
      label: "Status", 
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "IN_REVIEW", label: "In Review" },
        { value: "APPROVED", label: "Approved" },
        { value: "ASSIGNED", label: "Assigned" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
      ], 
      value: filters.status 
    },
    { 
      key: "priority", 
      label: "Priority", 
      options: [
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
        { value: "URGENT", label: "Urgent" },
      ], 
      value: filters.priority 
    },
  ]

  const columns: Column<ServiceRequestRow>[] = [
    { 
      key: "title", 
      label: "Request", 
      sortable: true, 
      render: (_, row) => (
        <div className="flex flex-col max-w-xs">
          <span className="font-medium text-gray-900 truncate">
            {row.title || `${row.service?.name || 'Service'} Request`}
          </span>
          <span className="text-xs text-gray-500 truncate">
            #{row.id.slice(-8).toUpperCase()}
          </span>
        </div>
      ) 
    },
    { 
      key: "client", 
      label: "Client", 
      sortable: true, 
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {row.client?.name || 'Unknown Client'}
          </span>
          <span className="text-xs text-gray-500">
            {row.client?.email}
          </span>
        </div>
      ) 
    },
    { 
      key: "service", 
      label: "Service", 
      sortable: true, 
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">
            {row.service?.name || 'Unknown Service'}
          </span>
          {row.service?.category && (
            <span className="text-xs text-gray-500">
              {row.service.category}
            </span>
          )}
        </div>
      ) 
    },
    { 
      key: "status", 
      label: "Status", 
      sortable: true, 
      render: (_, row) => getStatusBadge(row.status)
    },
    { 
      key: "priority", 
      label: "Priority", 
      sortable: true, 
      render: (_, row) => getPriorityBadge(row.priority)
    },
    { 
      key: "budget", 
      label: "Budget", 
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-900">
            {formatCurrency(row.budgetMin, row.budgetMax)}
          </span>
        </div>
      )
    },
    { 
      key: "assignedTeamMember", 
      label: "Assigned To", 
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-900">
            {row.assignedTeamMember?.name || 'Unassigned'}
          </span>
        </div>
      )
    },
    { 
      key: "createdAt", 
      label: "Created", 
      sortable: true, 
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-900">
            {formatDate(row.createdAt)}
          </span>
        </div>
      )
    },
    { 
      key: "actions", 
      label: "", 
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {/* Show conversion opportunity for approved/assigned requests */}
          {['APPROVED', 'ASSIGNED'].includes(row.status) && !row.isBooking && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={() => convertToBooking(row.id)}
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Book
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => window.location.href = `/admin/service-requests/${row.id}`}
          >
            View
          </Button>
        </div>
      )
    }
  ]

  // Service request to booking conversion function
  const convertToBooking = async (serviceRequestId: string) => {
    try {
      const response = await fetch(`/api/admin/service-requests/${serviceRequestId}/convert-to-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const { bookingId } = await response.json()
        window.location.href = `/admin/bookings/${bookingId}`
      } else {
        const { toastError } = await import('@/lib/toast-api')
        toastError('Failed to convert service request to booking')
      }
    } catch (error) {
      const { toastError } = await import('@/lib/toast-api')
      toastError('Failed to convert service request to booking')
    }
  }

  const actions: RowAction<ServiceRequestRow>[] = [
    { 
      label: "View Details", 
      onClick: (row) => { 
        window.location.href = `/admin/service-requests/${row.id}` 
      } 
    },
    { 
      label: "Convert to Booking", 
      onClick: (row) => convertToBooking(row.id),
      // Note: show property not supported in RowAction interface
    },
  ]

  const rows: ServiceRequestRow[] = useMemo(() => (items as ServiceRequestRow[]), [items])

  return (
    <ListPage<ServiceRequestRow>
      title="Service Requests"
      subtitle="Manage client service requests and convert to bookings"
      primaryAction={{ 
        label: "New Service Request", 
        onClick: () => (window.location.href = "/admin/service-requests/new") 
      }}
      secondaryActions={[
        { label: "Refresh", onClick: () => refresh() },
        { label: "Export", onClick: () => console.log('Export functionality to be implemented') }
      ]}
      filters={filterConfigs}
      onFilterChange={onFilterChange}
      onSearch={(value) => setQ(value)}
      searchPlaceholder="Search requests, clients, services..."
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
