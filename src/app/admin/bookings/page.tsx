"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  Users,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Filter
} from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column } from '@/types/dashboard'

interface Booking {
  id: string
  clientId?: string | null
  clientName: string | null
  clientEmail: string | null
  clientPhone?: string | null
  serviceId?: string | null
  serviceName?: string | null
  servicePrice?: number | null
  serviceCategory?: string | null
  scheduledAt: string
  duration: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string | null
  adminNotes?: string | null
  location?: 'OFFICE' | 'REMOTE' | 'CLIENT_SITE' | null
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null
  source?: 'WEBSITE' | 'PHONE' | 'REFERRAL' | 'WALK_IN' | 'MARKETING' | null
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | null
  reminderSent?: boolean
  confirmed?: boolean
  createdAt: string
  updatedAt?: string | null
  assignedTeamMember?: {
    id: string
    name: string
    email: string
  } | null
  client?: {
    id?: string
    name?: string | null
    email: string
    phone?: string | null
    tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE' | null
  } | null
  service?: {
    id?: string
    name?: string | null
    price?: number | null
    category?: string | null
    duration?: number | null
  } | null
}

interface BookingStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  todayBookings: number
  weekRevenue: number
  averageBookingValue: number
  noShows: number
  completionRate: number
  growth: number
}

const EMPTY_STATS: BookingStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  todayBookings: 0,
  weekRevenue: 0,
  averageBookingValue: 0,
  noShows: 0,
  completionRate: 0,
  growth: 0
}

export default function BookingManagementPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats>(EMPTY_STATS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<keyof Booking>('scheduledAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const pageSize = 25

  const { canManageBookings, role } = usePermissions()

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(dateRange !== 'all' && getDates(dateRange))
      })

      const [bookingsRes, statsRes] = await Promise.allSettled([
        apiFetch(`/api/admin/bookings?${params.toString()}`),
        apiFetch('/api/admin/bookings/stats')
      ])

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
        const data = await bookingsRes.value.json()
        setBookings(data.bookings || [])
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const data = await statsRes.value.json()
        setStats(data.data || EMPTY_STATS)
      }
    } catch (err) {
      console.error('Error loading bookings:', err)
      setError('Failed to load bookings data')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, selectedStatus, dateRange, sortBy, sortOrder])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const getDates = (range: string) => {
    const now = new Date()
    const dates: { startDate?: string; endDate?: string } = {}
    
    switch (range) {
      case 'today':
        dates.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        dates.endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
        break
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dates.startDate = weekStart.toISOString()
        dates.endDate = now.toISOString()
        break
      case 'month':
        dates.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        dates.endDate = now.toISOString()
        break
    }
    return dates
  }

  // Filter bookings client-side for immediate feedback
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.clientName?.toLowerCase().includes(term) ||
        booking.clientEmail?.toLowerCase().includes(term) ||
        booking.serviceName?.toLowerCase().includes(term) ||
        booking.notes?.toLowerCase().includes(term)
      )
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(booking => booking.location === selectedLocation)
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(booking => booking.priority === selectedPriority)
    }

    return filtered
  }, [bookings, searchTerm, selectedLocation, selectedPriority])

  const exportBookings = () => {
    const csvData = filteredBookings.map(booking => ({
      'Booking ID': booking.id,
      'Client Name': booking.clientName || '',
      'Client Email': booking.clientEmail || '',
      'Client Phone': booking.clientPhone || '',
      'Service': booking.serviceName || '',
      'Scheduled Date': new Date(booking.scheduledAt).toLocaleDateString(),
      'Scheduled Time': new Date(booking.scheduledAt).toLocaleTimeString(),
      'Duration': `${booking.duration} mins`,
      'Status': booking.status,
      'Location': booking.location || '',
      'Priority': booking.priority || '',
      'Amount': booking.servicePrice ? `$${booking.servicePrice}` : '',
      'Payment Status': booking.paymentStatus || '',
      'Created': new Date(booking.createdAt).toLocaleDateString(),
      'Notes': booking.notes || '',
      'Admin Notes': booking.adminNotes || ''
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedBookings.length === 0) return

    try {
      const promises = selectedBookings.map(bookingId =>
        apiFetch(`/api/admin/bookings/${bookingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
          headers: { 'Content-Type': 'application/json' }
        })
      )

      await Promise.all(promises)
      setSelectedBookings([])
      loadBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      setError('Failed to update booking status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      NO_SHOW: { color: 'bg-gray-100 text-gray-800', label: 'No Show' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority?: string | null) => {
    if (!priority) return null
    const priorityConfig = {
      LOW: { color: 'bg-gray-100 text-gray-600', icon: null },
      NORMAL: { color: 'bg-blue-100 text-blue-600', icon: null },
      HIGH: { color: 'bg-orange-100 text-orange-600', icon: AlertTriangle },
      URGENT: { color: 'bg-red-100 text-red-600', icon: AlertTriangle }
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    const Icon = config?.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {Icon && <Icon className="w-3 h-3" />}
        {priority.charAt(0) + priority.slice(1).toLowerCase()}
      </Badge>
    )
  }

  const columns: Column<Booking>[] = [
    { 
      key: 'clientName', 
      label: 'Client', 
      sortable: true,
      render: (value, booking) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {(booking.clientName || booking.clientEmail)?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {booking.clientName || 'Unnamed Client'}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {booking.clientEmail}
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'serviceName', 
      label: 'Service', 
      sortable: true,
      render: (value, booking) => (
        <div>
          <div className="font-medium text-gray-900">
            {booking.serviceName || 'Service'}
          </div>
          {booking.serviceCategory && (
            <div className="text-sm text-gray-500">{booking.serviceCategory}</div>
          )}
        </div>
      )
    },
    { 
      key: 'scheduledAt', 
      label: 'Date & Time', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">
              {new Date(value).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => getStatusBadge(value as string)
    },
    { 
      key: 'priority', 
      label: 'Priority', 
      sortable: true,
      render: (value) => getPriorityBadge(value as string)
    },
    { 
      key: 'location', 
      label: 'Location', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{value || 'TBD'}</span>
        </div>
      )
    },
    { 
      key: 'servicePrice', 
      label: 'Amount', 
      sortable: true, 
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>${Number(value || 0).toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, booking) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/admin/bookings/${booking.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          {canManageBookings && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/admin/bookings/${booking.id}/edit`}>
                <Edit3 className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      )
    }
  ]

  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'NO_SHOW', label: 'No Show' }
      ],
      value: selectedStatus
    },
    {
      key: 'location',
      label: 'Location',
      options: [
        { value: 'all', label: 'All Locations' },
        { value: 'OFFICE', label: 'Office' },
        { value: 'REMOTE', label: 'Remote' },
        { value: 'CLIENT_SITE', label: 'Client Site' }
      ],
      value: selectedLocation
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'LOW', label: 'Low' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' }
      ],
      value: selectedPriority
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      options: [
        { value: 'all', label: 'All Dates' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' }
      ],
      value: dateRange
    }
  ]

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setSelectedStatus(value)
    if (key === 'location') setSelectedLocation(value)
    if (key === 'priority') setSelectedPriority(value)
    if (key === 'dateRange') setDateRange(value)
    setCurrentPage(1) // Reset pagination
  }

  return (
    <ListPage
      title="Booking Management"
      subtitle="Manage appointments, scheduling, and client bookings"
      primaryAction={canManageBookings ? { label: 'New Booking', onClick: () => window.location.href = '/admin/bookings/new', icon: Plus } : undefined}
      secondaryActions={[
        { label: 'Export CSV', onClick: exportBookings, icon: Download },
        { label: 'Refresh', onClick: loadBookings, icon: RefreshCw }
      ]}
      onSearch={setSearchTerm}
      searchPlaceholder="Search bookings, clients, services..."
      filters={filterConfigs}
      onFilterChange={handleFilterChange}
      columns={columns}
      rows={filteredBookings}
      loading={loading}
    />
  )
}