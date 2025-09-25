"use client"


import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import {
  Calendar,
  DollarSign,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ListPage from '@/components/dashboard/templates/ListPage'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  scheduledAt: string
  duration: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  createdAt: string
  updatedAt?: string
  assignedStaff?: string
  assignedTeamMember?: { id: string; name: string; email: string }
  location?: 'OFFICE' | 'REMOTE' | 'CLIENT_SITE'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  service: {
    id?: string
    name: string
    price?: number | string
    category?: string
    duration?: number
  }
  client: {
    id?: string
    name: string
    email: string
    phone?: string
    tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE'
    totalBookings?: number
    totalRevenue?: number
    lastBooking?: string
    satisfaction?: number
  }
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  source?: 'WEBSITE' | 'PHONE' | 'REFERRAL' | 'WALK_IN' | 'MARKETING'
  reminderSent?: boolean
}

interface TeamMemberLite { id: string; name: string; email: string; title?: string; department?: string; isAvailable?: boolean }

type BookingRow = { id: string; client: string; service: string; when: string; status: string; amount: number }

export default function EnhancedBookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'client' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberLite[]>([])

  const columns: import('@/types/dashboard').Column<BookingRow>[] = [
    { key: 'client', label: 'Client', sortable: true },
    { key: 'service', label: 'Service', sortable: true },
    { key: 'when', label: 'Date & Time', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v) => `$${Number(v||0).toLocaleString()}` },
  ]

  const rows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    client: b.clientName || b.client?.name || 'Client',
    service: b.service?.name || 'Service',
    when: new Date(b.scheduledAt).toISOString(),
    status: b.status,
    amount: Number(typeof b.service?.price === 'string' ? Number(b.service?.price) : b.service?.price || 0),
  }))

  const filtersConfig: import('@/types/dashboard').FilterConfig[] = [
    { key: 'dateRange', label: 'Date Range', options: [
      { value: 'all', label: 'All Dates' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
    ], value: dateFilter },
    { key: 'status', label: 'Status', options: [
      { value: 'all', label: 'All Status' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'NO_SHOW', label: 'No Show' },
    ], value: statusFilter },
  ]

  const onFilterChange = (key: string, value: string) => {
    if (key === 'dateRange') setDateFilter(value)
    if (key === 'status') setStatusFilter(value)
  }

  async function refresh() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      params.set('offset', '0')
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      // Map date filter to start/end ISO strings
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date()
        let start = new Date(now)
        if (dateFilter === 'today') {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        } else if (dateFilter === 'week') {
          start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
          start.setHours(0,0,0,0)
        } else if (dateFilter === 'month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        }
        params.set('startDate', start.toISOString())
        params.set('endDate', now.toISOString())
      }
      const sortField = ((): string => {
        if (sortBy === 'status') return 'status'
        return 'scheduledAt'
      })()
      params.set('sortBy', sortField)
      params.set('sortOrder', sortOrder)
      const response = await apiFetch(`/api/admin/bookings?${params.toString()}`)
      if (!response.ok) {
        const { toastFromResponse } = await import('@/lib/toast-api')
        await toastFromResponse(response, { failure: 'Failed to load bookings' })
      }
      const data: unknown = response.ok ? await response.json() : { bookings: [] }

      type ApiBookingRecord = {
        id: string
        clientName?: string
        clientEmail?: string
        clientPhone?: string | null
        scheduledAt: string | Date
        duration?: number | null
        status?: Booking['status'] | string | null
        notes?: string | null
        createdAt?: string | Date
        updatedAt?: string | Date
        assignedStaff?: string | null
        assignedTeamMember?: { id: string; name: string; email: string } | null
        location?: Booking['location']
        priority?: Booking['priority']
        service?: { id?: string; name?: string; price?: number | string | null; category?: string | null; duration?: number | null } | null
        client?: { id?: string; name?: string | null; email?: string; phone?: string | null; tier?: Booking['client']['tier']; totalBookings?: number; satisfaction?: number; lastBooking?: string; _count?: { bookings: number } } | null
        source?: Booking['source']
      }

      const items: ApiBookingRecord[] = Array.isArray(data)
        ? (data as ApiBookingRecord[])
        : (data && typeof data === 'object' && Array.isArray((data as { bookings?: unknown }).bookings)
          ? ((data as { bookings: unknown[] }).bookings as ApiBookingRecord[])
          : [])

      const enhanced: Booking[] = items.map((r) => {
        const clientObj = r.client ?? null
        const serviceObj = r.service ?? null

        const client: Booking['client'] = {
          id: clientObj?.id,
          name: (clientObj?.name ?? r.clientName ?? r.clientEmail ?? 'Client') as string,
          email: (clientObj?.email ?? r.clientEmail ?? '') as string,
          phone: (clientObj?.phone ?? r.clientPhone ?? undefined) || undefined,
          tier: clientObj?.tier,
          totalBookings: (clientObj?._count?.bookings ?? clientObj?.totalBookings),
          lastBooking: clientObj?.lastBooking,
          satisfaction: clientObj?.satisfaction,
        }

        const service: Booking['service'] = {
          id: serviceObj?.id,
          name: (serviceObj?.name ?? 'Unknown service') as string,
          price: serviceObj?.price ?? undefined,
          category: serviceObj?.category ?? undefined,
          duration: serviceObj?.duration ?? undefined,
        }

        const statusRaw = String(r.status ?? 'PENDING').toUpperCase()
        const status: Booking['status'] = (['PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'] as const).includes(statusRaw as Booking['status'])
          ? (statusRaw as Booking['status'])
          : 'PENDING'

        const scheduledAtStr = typeof r.scheduledAt === 'string' ? r.scheduledAt : new Date(r.scheduledAt).toISOString()

        return {
          id: r.id,
          clientName: r.clientName ?? client.name,
          clientEmail: r.clientEmail ?? client.email,
          clientPhone: r.clientPhone ?? client.phone,
          scheduledAt: scheduledAtStr,
          duration: Number(r.duration ?? service.duration ?? 60),
          status,
          notes: r.notes ?? undefined,
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt || Date.now()).toISOString(),
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : (r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined),
          assignedStaff: r.assignedStaff ?? undefined,
          assignedTeamMember: r.assignedTeamMember ?? undefined,
          location: r.location ?? (['OFFICE', 'REMOTE', 'CLIENT_SITE'] as const)[Math.floor(Math.random() * 3)],
          priority: r.priority ?? (['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const)[Math.floor(Math.random() * 4)],
          service,
          client: {
            ...client,
            tier: client.tier ?? (['INDIVIDUAL', 'SMB', 'ENTERPRISE'] as const)[Math.floor(Math.random() * 3)],
            totalBookings: client.totalBookings ?? undefined,
            satisfaction: client.satisfaction ?? 3.5 + Math.random() * 1.5,
          },
          source: r.source ?? (['WEBSITE', 'PHONE', 'REFERRAL', 'WALK_IN', 'MARKETING'] as const)[Math.floor(Math.random() * 5)],
          reminderSent: false,
        }
      })

      setBookings(enhanced)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/team-members')
        const json = await res.json().catch(() => ({}))
        const list: TeamMemberLite[] = Array.isArray(json?.teamMembers) ? json.teamMembers : []
        setTeamMembers(list)
      } catch {
        setTeamMembers([])
      }
    })()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const id = window.setInterval(() => refresh(), 30000)
      intervalRef.current = id
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current)
      }
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [autoRefresh])

  return (
    <ListPage<BookingRow>
      title="Bookings"
      subtitle="Manage and monitor appointments"
      primaryAction={{ label: 'New Booking', onClick: () => (window.location.href = '/admin/bookings/new') }}
      secondaryActions={[
        { label: autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh', onClick: () => setAutoRefresh((v) => !v) },
        { label: 'Refresh', onClick: () => refresh() },
      ]}
      filters={filtersConfig}
      onFilterChange={onFilterChange}
      onSearch={(q) => setSearchTerm(q)}
      searchPlaceholder="Search bookings"
      columns={columns}
      rows={rows}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(k) => setSortBy(k as any)}
      selectable
    />
  )
}
