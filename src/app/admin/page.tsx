/**
 * Modern Admin Dashboard Overview
 * 
 * Professional QuickBooks-inspired admin dashboard using AnalyticsPage template
 * with real-time KPIs, charts, and activity feeds.
 * 
 * Features:
 * - Live KPI metrics with trend indicators
 * - Revenue and booking trend charts
 * - Real-time activity feed
 * - Export capabilities
 * - Role-based access control
 */

'use client'

import { useMemo, useState } from 'react'
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'
import IntelligentActivityFeed from '@/components/dashboard/analytics/IntelligentActivityFeed'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { Download, RefreshCw, Calendar, Users } from 'lucide-react'
import { startOfWeek, endOfWeek } from 'date-fns'
import type { ActionItem, FilterConfig } from '@/types/dashboard'

interface DashboardStats {
  revenue: {
    current: number
    target: number
    targetProgress: number
    trend: number
  }
  bookings: {
    total: number
    today: number
    pending: number
    conversion: number
  }
  clients: {
    active: number
    new: number
    retention: number
    satisfaction: number
  }
  tasks: {
    productivity: number
    completed: number
    overdue: number
    dueToday: number
  }
}

type BookingStatsPayload = {
  total?: number
  pending?: number
  todayBookings?: number
  weekRevenue?: number
  completionRate?: number
  growth?: number
  averageBookingValue?: number
}

type ServiceRequestAnalyticsPayload = {
  total?: number
  newThisWeek?: number
  completedThisMonth?: number
  pipelineValue?: number
  statusDistribution?: Record<string, number>
  priorityDistribution?: Record<string, number>
  completionRate?: number
}

type TaskAnalyticsPayload = {
  total?: number
  completed?: number
  byStatus?: Array<{ status: string | null; _count?: { _all?: number } }>
  dailyTotals?: number[]
  dailyCompleted?: number[]
}

type ServicesStatsPayload = {
  totalRevenue?: number
  analytics?: {
    revenueTimeSeries?: Array<{ service: string; monthly: Array<{ month: string; revenue: number }> }>
  }
}

type UsersStatsPayload = {
  total?: number
  clients?: number
  staff?: number
  admins?: number
  newThisMonth?: number
  activeUsers?: number
  growth?: number
}

type AnalyticsResponse = {
  revenue_trend?: Array<{ month: string; revenue: number; target?: number }>
}

const clamp = (value: number, min = 0, max = 100) => {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

const safeNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('month')
  const analyticsRange = timeframe === 'today' ? '24h' : timeframe === 'week' ? '7d' : '30d'
  const servicesRange = timeframe === 'today' ? '7d' : timeframe === 'week' ? '30d' : '90d'
  const usersRange = timeframe === 'today' ? '7d' : timeframe === 'week' ? '30d' : '90d'

  const {
    data: analytics,
    error: analyticsError,
    isLoading: analyticsLoading,
  } = useUnifiedData<AnalyticsResponse>({
    key: 'analytics',
    params: { range: analyticsRange },
    events: ['service-request-updated', 'task-updated', 'booking_update', 'system_alert', 'heartbeat', 'ready'],
    revalidateOnEvents: true,
  })

  const {
    data: bookingStats,
    error: bookingStatsError,
    isLoading: bookingStatsLoading,
  } = useUnifiedData<{ success?: boolean; data?: BookingStatsPayload }>({
    key: 'bookings/stats',
    events: ['booking_update', 'service-request-updated', 'task-updated', 'heartbeat'],
    revalidateOnEvents: true,
  })

  const {
    data: serviceRequestsAnalytics,
    error: serviceRequestsError,
    isLoading: serviceRequestsLoading,
  } = useUnifiedData<{ success?: boolean; data?: ServiceRequestAnalyticsPayload }>({
    key: 'service-requests/analytics',
    events: ['service-request-updated', 'task-updated', 'booking_update'],
    revalidateOnEvents: true,
  })

  const {
    data: tasksAnalyticsData,
    error: tasksError,
    isLoading: tasksLoading,
  } = useUnifiedData<TaskAnalyticsPayload>({
    key: 'tasks/analytics',
    events: ['task-updated', 'service-request-updated'],
    revalidateOnEvents: true,
  })

  const {
    data: servicesStatsData,
    error: servicesError,
    isLoading: servicesStatsLoading,
  } = useUnifiedData<ServicesStatsPayload>({
    key: 'services/stats',
    params: { range: servicesRange },
    events: ['booking_update', 'service-request-updated', 'task-updated'],
    revalidateOnEvents: true,
  })

  const {
    data: usersOverview,
    error: usersError,
    isLoading: usersLoading,
  } = useUnifiedData<UsersStatsPayload>({
    key: 'stats/users',
    params: { range: usersRange },
    events: ['service-request-updated', 'booking_update', 'task-updated'],
    revalidateOnEvents: true,
  })

  const { data: recentBookingsResp } = useUnifiedData<{ bookings: any[]; total: number }>({
    key: 'bookings',
    params: { limit: 10, sortBy: 'scheduledAt', sortOrder: 'desc' },
    events: ['booking_update'],
  })

  const { data: highPriorityTasks } = useUnifiedData<any[]>({
    key: 'tasks',
    params: { priority: 'HIGH', status: 'OPEN', orderBy: 'dueAt', order: 'asc', limit: 10 },
    events: ['task-updated'],
  })
  const { data: dueSoonTasks } = useUnifiedData<any[]>({
    key: 'tasks',
    params: { orderBy: 'dueAt', order: 'asc', limit: 10 },
    events: ['task-updated'],
  })

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 })
  const { data: weekBookingsResp } = useUnifiedData<{ total: number }>({
    key: 'bookings',
    params: { startDate: weekStart.toISOString(), endDate: weekEnd.toISOString() },
    events: ['booking_update'],
    parse: (raw: any) => ({ total: Number(raw?.total || 0) })
  })

  const bookingsPayload: BookingStatsPayload = ((bookingStats as any)?.data || bookingStats || {}) as BookingStatsPayload
  const serviceRequestPayload: ServiceRequestAnalyticsPayload = ((serviceRequestsAnalytics as any)?.data || serviceRequestsAnalytics || {}) as ServiceRequestAnalyticsPayload
  const tasksPayload: TaskAnalyticsPayload = (tasksAnalyticsData || {}) as TaskAnalyticsPayload
  const servicesPayload: ServicesStatsPayload = (servicesStatsData || {}) as ServicesStatsPayload
  const usersPayload: UsersStatsPayload = (usersOverview || {}) as UsersStatsPayload

  const revenueMetrics = useMemo(() => {
    const weekRevenue = safeNumber(bookingsPayload.weekRevenue)
    const averageBookingValue = safeNumber(bookingsPayload.averageBookingValue)
    const todayRevenue = safeNumber(bookingsPayload.todayBookings) * averageBookingValue
    const totalRevenue = safeNumber(servicesPayload.totalRevenue, weekRevenue)
    const current = timeframe === 'today' ? todayRevenue : timeframe === 'week' ? weekRevenue : totalRevenue
    const fallbackTarget = timeframe === 'month' ? totalRevenue * 1.1 : (current || weekRevenue) * 1.15
    const target = Math.max(fallbackTarget, current * 1.1, 5000)
    const progress = target > 0 ? clamp((current / target) * 100) : 0
    const trend = safeNumber(bookingsPayload.growth)
    return { current, target, progress, trend }
  }, [bookingsPayload, servicesPayload, timeframe])

  const totalBookings = safeNumber(bookingsPayload.total)
  const todayBookings = safeNumber(bookingsPayload.todayBookings)
  const pendingBookings = safeNumber(bookingsPayload.pending)
  const conversionRate = clamp(safeNumber(bookingsPayload.completionRate), 0, 100)

  const statusCounts = new Map<string, number>()
  ;(tasksPayload.byStatus || []).forEach((item) => {
    const key = String(item?.status ?? '').toUpperCase()
    statusCounts.set(key, (statusCounts.get(key) || 0) + safeNumber(item?._count?._all))
  })
  const overdueTasks = ['OVERDUE', 'PAST_DUE', 'LATE'].reduce((acc, key) => acc + (statusCounts.get(key) || 0), 0)
  const dueTodayCount = safeNumber((tasksPayload.dailyTotals || []).slice(-1)[0])
  const totalTasks = safeNumber(tasksPayload.total)
  const completedTasks = safeNumber(tasksPayload.completed)
  const productivity = totalTasks > 0 ? clamp((completedTasks / totalTasks) * 100) : 0

  const activeClients = safeNumber(usersPayload.clients)
  const newClients = safeNumber(usersPayload.newThisMonth)
  const retentionRate = activeClients > 0 ? clamp(((activeClients - newClients) / Math.max(activeClients, 1)) * 100) : 100
  const satisfactionScore = clamp(safeNumber(serviceRequestPayload.completionRate) / 20, 0, 5)

  const stats: DashboardStats = {
    revenue: {
      current: revenueMetrics.current,
      target: revenueMetrics.target,
      targetProgress: clamp(revenueMetrics.progress),
      trend: revenueMetrics.trend,
    },
    bookings: {
      total: totalBookings,
      today: todayBookings,
      pending: pendingBookings,
      conversion: conversionRate,
    },
    clients: {
      active: activeClients,
      new: newClients,
      retention: retentionRate,
      satisfaction: satisfactionScore,
    },
    tasks: {
      productivity,
      completed: completedTasks,
      overdue: overdueTasks,
      dueToday: dueTodayCount,
    },
  }

  const revenueTrendData = useMemo(() => {
    const timeSeries = servicesPayload.analytics?.revenueTimeSeries
    if (Array.isArray(timeSeries) && timeSeries.length > 0) {
      const monthLabels = timeSeries[0]?.monthly?.map((entry) => entry.month) || []
      if (monthLabels.length > 0) {
        return monthLabels.map((month, index) => {
          const revenue = timeSeries.reduce((sum, series) => sum + safeNumber(series.monthly?.[index]?.revenue), 0)
          return {
            month,
            revenue,
            target: index === monthLabels.length - 1 ? revenueMetrics.target : undefined,
          }
        })
      }
    }
    return analytics?.revenue_trend
  }, [servicesPayload, analytics, revenueMetrics.target])

  const combinedError = analyticsError || bookingStatsError || serviceRequestsError || tasksError || servicesError || usersError
  const errorMessage = combinedError ? 'Failed to load dashboard metrics' : null

  // Primary actions for the dashboard (with validation)
  const primaryAction: ActionItem = {
    label: 'Quick Actions',
    icon: Calendar,
    href: '/admin/bookings/new',
    variant: 'default' as const
  }

  const secondaryActions: ActionItem[] = [
    {
      label: 'Export Report',
      icon: Download,
      onClick: () => handleExport(),
      variant: 'outline' as const
    },
    {
      label: 'Refresh Data',
      icon: RefreshCw,
      onClick: () => window.location.reload(),
      variant: 'ghost' as const
    }
  ].filter((action: ActionItem) => action.label && (action.onClick || action.href)) // Validate actions

  // Filter configurations
  const filters: FilterConfig[] = [
    {
      key: 'timeframe',
      label: 'Time Period',
      type: 'select',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' }
      ],
      defaultValue: timeframe
    }
  ]

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'timeframe') {
      setTimeframe(value as 'today' | 'week' | 'month')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export?entity=dashboard&format=csv')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const isLoading = analyticsLoading || bookingStatsLoading || serviceRequestsLoading || tasksLoading || servicesStatsLoading || usersLoading

  // Map activity feed datasets
  const activityData = {
    recentBookings: (recentBookingsResp?.bookings || []).map((b: any) => ({
      id: b.id,
      clientName: b.clientName || b.client?.name,
      service: b.service?.name,
      scheduledAt: b.scheduledAt,
      duration: b.duration || b.service?.duration || 0,
      revenue: b.service?.price || 0,
      priority: 'normal',
      status: String(b.status || '').toLowerCase(),
      location: 'office',
      assignedTo: b.assignedTeamMember?.name || null,
      notes: b.notes || ''
    })),
    urgentTasks: (highPriorityTasks || [])
      .filter((t: any) => String(t.status || '').toUpperCase() !== 'DONE')
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: String(t.priority || 'HIGH').toLowerCase(),
        description: t.description || '',
        completionPercentage: Number(t.completionPercentage || 0),
        dueDate: t.dueAt || new Date().toISOString(),
        estimatedHours: t.estimatedHours || 0,
        category: t.category || 'General',
        assignee: t.assignee?.name || 'Unassigned',
        status: t.status || 'OPEN'
      })),
    upcomingDeadlines: (dueSoonTasks || [])
      .filter((t: any) => !!t.dueAt)
      .slice(0, 10)
      .map((t: any) => {
        const due = new Date(t.dueAt)
        const daysUntilDue = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const importance = daysUntilDue <= 3 ? 'critical' : 'default'
        return {
          id: t.id,
          title: t.title,
          description: t.description || '',
          dueDate: t.dueAt,
          importance,
          clientName: t.clientName || '—',
          assignedTo: t.assignee?.name || 'Unassigned',
          progress: Number(t.completionPercentage || 0)
        }
      })
  }

  return (
    <AnalyticsPage
      title="Dashboard Overview"
      subtitle="Key performance indicators and business metrics"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      filters={filters}
      onFilterChange={handleFilterChange}
      searchPlaceholder="Search dashboard data..."
      loading={isLoading}
      error={errorMessage}
      stats={stats}
      revenueTrend={revenueTrendData}
    >
      {/* Additional dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Activity Feed */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <IntelligentActivityFeed
            data={activityData}
          />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {usersPayload.activeUsers || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {weekBookingsResp?.total || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsPage>
  )
}
