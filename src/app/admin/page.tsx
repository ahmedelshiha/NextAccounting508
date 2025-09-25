'use client'

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { Pie, Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title as ChartTitle } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ChartTitle)
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  ArrowRight,
  BarChart3,
  FileText,
  Mail,
  RefreshCw,
  Bell,
  ChevronDown,
  ExternalLink,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  CalendarDays,
  AlertTriangle,
  Star,
  MapPin,
  Phone,
  Activity,
  Target,
  TrendingDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card as UCard, CardContent as UCardContent } from '@/components/ui/card'
import PrimaryTabs from '@/components/dashboard/PrimaryTabs'
import FilterBar from '@/components/dashboard/FilterBar'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import AdminKPIGrid from '@/components/dashboard/analytics/ProfessionalKPIGrid'
import BusinessIntelligence from '@/components/dashboard/analytics/BusinessIntelligence'
import IntelligentActivityFeed from '@/components/dashboard/analytics/IntelligentActivityFeed'
import type { FilterConfig, TabItem, Column } from '@/types/dashboard'
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'

const fetcher = (url: string) => fetch(url).then(async (r) => {
  if (!r.ok) throw new Error((await r.json().catch(() => ({ error: r.statusText }))).error || 'Request failed')
  return r.json()
})

interface DashboardData {
  stats: DashboardStats
  recentBookings: Booking[]
  urgentTasks: Task[]
  systemHealth: SystemHealth
  notifications: Notification[]
  revenueAnalytics: RevenueAnalytics
  clientInsights: ClientInsights
  upcomingDeadlines: Deadline[]
  performanceMetrics: PerformanceMetrics
}

interface DashboardStats {
  revenue: { 
    current: number
    previous: number 
    trend: number
    target: number
    targetProgress: number
  }
  bookings: { 
    total: number
    today: number
    thisWeek: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    conversion: number
  }
  clients: { 
    total: number
    new: number
    active: number
    inactive: number
    retention: number
    satisfaction: number
  }
  tasks: { 
    total: number
    overdue: number
    dueToday: number
    completed: number
    inProgress: number
    productivity: number
  }
}

interface Booking {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  service: string
  serviceCategory: string
  scheduledAt: string
  duration: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  revenue: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  location: 'office' | 'remote' | 'client_site'
  assignedTo?: string
  notes?: string
  isRecurring: boolean
  source: 'website' | 'referral' | 'direct' | 'marketing'
}

interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate: string
  assignee?: string
  assigneeAvatar?: string
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
  category: 'booking' | 'client' | 'system' | 'finance' | 'compliance' | 'marketing'
  estimatedHours: number
  actualHours?: number
  completionPercentage: number
  dependencies?: string[]
  clientId?: string
  bookingId?: string
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  database: { 
    status: 'healthy' | 'warning' | 'error'
    responseTime: number
    connections: number
    lastBackup: string
  }
  email: { 
    status: 'healthy' | 'warning' | 'error'
    deliveryRate: number
    bounceRate: number
    lastSent: string
  }
  api: { 
    status: 'healthy' | 'warning' | 'error'
    uptime: number
    averageResponseTime: number
    errorRate: number
  }
  storage: {
    status: 'healthy' | 'warning' | 'error'
    used: number
    total: number
    growth: number
  }
  security: {
    status: 'healthy' | 'warning' | 'error'
    failedLogins: number
    lastSecurityScan: string
    vulnerabilities: number
  }
}

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'urgent'
  category: 'system' | 'booking' | 'client' | 'task' | 'revenue' | 'security'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionRequired: boolean
  actionUrl?: string
  priority: number
}

interface RevenueAnalytics {
  dailyRevenue: { date: string; amount: number; bookings: number }[]
  monthlyTrend: { month: string; revenue: number; target: number }[]
  serviceBreakdown: { service: string; revenue: number; percentage: number; count: number }[]
  clientSegments: { segment: string; revenue: number; clients: number }[]
  forecastData: { period: string; forecast: number; confidence: number }[]
}

interface ClientInsights {
  topClients: { id: string; name: string; revenue: number; bookings: number; lastBooking: string; tier: string }[]
  satisfactionTrends: { month: string; score: number; responses: number }[]
  retentionMetrics: { newClients: number; returningClients: number; churnRate: number; lifetimeValue: number }
  geographicDistribution: { location: string; clients: number; revenue: number }[]
}

interface Deadline {
  id: string
  type: 'tax' | 'compliance' | 'report' | 'audit' | 'filing' | 'review'
  title: string
  description: string
  dueDate: string
  clientId?: string
  clientName?: string
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed'
  importance: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string
  estimatedHours: number
  progress: number
}

interface PerformanceMetrics {
  efficiency: { 
    bookingUtilization: number
    averageSessionDuration: number
    clientSatisfaction: number
    taskCompletionRate: number
  }
  growth: {
    monthOverMonth: number
    yearOverYear: number
    newClientAcquisition: number
    revenuePerClient: number
  }
  operational: {
    averageResponseTime: number
    firstCallResolution: number
    appointmentShowRate: number
    reschedulingRate: number
  }
}

interface AdminAnalyticsResponse {
  revenueByService?: { service: string; amount: number }[];
  dailyBookings?: { date?: string; count: number }[];
}

type BookingUpdateEvent = {
  id: string;
  clientName?: string;
  service?: string;
  scheduledAt: string;
  duration?: number;
  revenue?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  status?: Booking['status'];
  location?: Booking['location'];
}

type TaskCompletedEvent = { id: string }

type SystemAlertEvent = {
  id: string;
  title?: string;
  message?: string;
  severity?: Notification['type'];
}

// Admin bookings API minimal types
interface AdminBookingsList {
  bookings: Array<{
    id: string
    clientId?: string | null
    clientName?: string | null
    clientEmail?: string | null
    clientPhone?: string | null
    service?: { name?: string | null; price?: unknown } | null
    scheduledAt: string | Date
    duration?: number | null
    status?: string | null
    notes?: string | null
    client?: { name?: string | null; email?: string | null } | null
  }>
}

function isAdminBookingsList(val: unknown): val is AdminBookingsList {
  return typeof val === 'object' && val !== null && Array.isArray((val as { bookings?: unknown }).bookings)
}

interface HasToString { toString: () => string }
function toNumberish(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'string') { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  const s = (v as Partial<HasToString>)?.toString?.()
  if (typeof s === 'string') { const n = Number(s); return Number.isFinite(n) ? n : 0 }
  return 0
}

function useTasksAnalytics() {
  const [data, setData] = useState<{ total?: number; completed?: number; byStatus?: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await fetch('/api/admin/tasks/analytics')
        const j = await r.json().catch(() => ({}))
        if (!ignore) setData(j)
      } catch {
        if (!ignore) setData(null)
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])
  return { data, loading }
}

const mockDashboardData: DashboardData = {
  stats: {
    revenue: { current: 24500, previous: 21200, trend: 15.6, target: 30000, targetProgress: 81.7 },
    bookings: { total: 127, today: 8, thisWeek: 35, pending: 12, confirmed: 89, completed: 98, cancelled: 8, conversion: 89.2 },
    clients: { total: 245, new: 18, active: 198, inactive: 47, retention: 87.5, satisfaction: 4.6 },
    tasks: { total: 23, overdue: 3, dueToday: 7, completed: 156, inProgress: 13, productivity: 92.3 }
  },
  recentBookings: [
    {
      id: '1', clientId: 'c1', clientName: 'Ahmed Hassan', clientEmail: 'ahmed@example.com', clientPhone: '+20123456789',
      service: 'Tax Consultation', serviceCategory: 'Tax Services', scheduledAt: '2025-09-10T14:00:00Z',
      duration: 60, status: 'confirmed', revenue: 350, priority: 'normal', location: 'office',
      assignedTo: 'John Smith', isRecurring: false, source: 'website'
    },
    {
      id: '2', clientId: 'c2', clientName: 'Sarah Mohamed', clientEmail: 'sarah@company.com',
      service: 'Quarterly Audit Review', serviceCategory: 'Audit', scheduledAt: '2025-09-10T15:30:00Z',
      duration: 120, status: 'pending', revenue: 800, priority: 'high', location: 'client_site',
      assignedTo: 'Jane Doe', isRecurring: true, source: 'referral',
      notes: 'Client requested comprehensive review of Q3 financials'
    }
  ],
  urgentTasks: [
    {
      id: '1', title: 'Complete Q4 Financial Analysis for ABC Corp', description: 'Comprehensive quarterly review',
      priority: 'critical', dueDate: '2025-09-12', assignee: 'John Smith', status: 'in_progress',
      category: 'finance', estimatedHours: 8, actualHours: 5, completionPercentage: 65,
      clientId: 'c1', bookingId: 'b1'
    },
    {
      id: '2', title: 'Submit VAT Returns - Multiple Clients', description: 'Monthly VAT filing deadline',
      priority: 'high', dueDate: '2025-09-11', assignee: 'Jane Doe', status: 'pending',
      category: 'compliance', estimatedHours: 4, completionPercentage: 0
    }
  ],
  systemHealth: {
    overall: 'healthy',
    database: { status: 'healthy', responseTime: 45, connections: 23, lastBackup: '2025-09-10T02:00:00Z' },
    email: { status: 'healthy', deliveryRate: 98.5, bounceRate: 1.2, lastSent: '2025-09-10T08:30:00Z' },
    api: { status: 'warning', uptime: 99.2, averageResponseTime: 125, errorRate: 0.8 },
    storage: { status: 'healthy', used: 2.4, total: 10, growth: 12.5 },
    security: { status: 'healthy', failedLogins: 2, lastSecurityScan: '2025-09-09T00:00:00Z', vulnerabilities: 0 }
  },
  notifications: [
    {
      id: '1', type: 'urgent', category: 'task', title: 'Critical Deadline Approaching',
      message: 'VAT returns due tomorrow for 15 clients', timestamp: '2025-09-10T09:00:00Z',
      read: false, actionRequired: true, actionUrl: '/admin/tasks/vat-returns', priority: 1
    },
    {
      id: '2', type: 'warning', category: 'system', title: 'API Performance Alert',
      message: 'Response times above threshold (125ms avg)', timestamp: '2025-09-10T08:45:00Z',
      read: false, actionRequired: false, priority: 3
    }
  ],
  revenueAnalytics: {
    dailyRevenue: [
      { date: '2025-09-01', amount: 1200, bookings: 5 },
      { date: '2025-09-02', amount: 1800, bookings: 7 }
    ],
    monthlyTrend: [
      { month: 'Jul', revenue: 20000, target: 25000 },
      { month: 'Aug', revenue: 22000, target: 27000 },
      { month: 'Sep', revenue: 24500, target: 30000 }
    ],
    serviceBreakdown: [
      { service: 'Tax Services', revenue: 12000, percentage: 49, count: 45 },
      { service: 'Audit', revenue: 8500, percentage: 35, count: 12 },
      { service: 'Consulting', revenue: 4000, percentage: 16, count: 28 }
    ],
    clientSegments: [
      { segment: 'Enterprise', revenue: 15000, clients: 8 },
      { segment: 'SMB', revenue: 7500, clients: 35 },
      { segment: 'Individual', revenue: 2000, clients: 155 }
    ],
    forecastData: [
      { period: 'Oct 2025', forecast: 26000, confidence: 85 },
      { period: 'Nov 2025', forecast: 28000, confidence: 78 }
    ]
  },
  clientInsights: {
    topClients: [
      { id: 'c1', name: 'TechCorp Ltd', revenue: 5200, bookings: 8, lastBooking: '2025-09-08', tier: 'Enterprise' },
      { id: 'c2', name: 'Manufacturing Inc', revenue: 3800, bookings: 6, lastBooking: '2025-09-05', tier: 'Enterprise' }
    ],
    satisfactionTrends: [
      { month: 'Jul', score: 4.4, responses: 23 },
      { month: 'Aug', score: 4.6, responses: 31 }
    ],
    retentionMetrics: { newClients: 18, returningClients: 180, churnRate: 5.2, lifetimeValue: 2400 },
    geographicDistribution: [
      { location: 'Cairo', clients: 120, revenue: 15000 },
      { location: 'Alexandria', clients: 85, revenue: 7500 }
    ]
  },
  upcomingDeadlines: [
    {
      id: 'd1', type: 'tax', title: 'Corporate Tax Returns', description: 'Annual filing deadline for 12 clients',
      dueDate: '2025-09-15', status: 'due_soon', importance: 'critical', assignedTo: 'Tax Team',
      estimatedHours: 24, progress: 40, clientName: 'Multiple Clients'
    }
  ],
  performanceMetrics: {
    efficiency: { bookingUtilization: 87.5, averageSessionDuration: 85, clientSatisfaction: 4.6, taskCompletionRate: 94.2 },
    growth: { monthOverMonth: 15.6, yearOverYear: 28.3, newClientAcquisition: 22, revenuePerClient: 125.5 },
    operational: { averageResponseTime: 2.4, firstCallResolution: 89.2, appointmentShowRate: 92.3, reschedulingRate: 8.5 }
  }
}

function ProfessionalHeader({ data, autoRefresh, onToggleAutoRefresh, onRefresh, onExport, onMarkAllRead }: { data: DashboardData; autoRefresh: boolean; onToggleAutoRefresh: () => void; onRefresh: () => void; onExport: () => void; onMarkAllRead: () => void; }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [dashboardView, setDashboardView] = useState<'overview' | 'detailed'>('overview')
  const [rtTransport, setRtTransport] = useState<string>('')
  const [rtConn, setRtConn] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await fetch('/api/admin/system/health')
        const j = await r.json().catch(() => null)
        if (!ignore && j?.realtime) {
          setRtTransport(j.realtime.transport || '')
          setRtConn(j.realtime.connectionCount || 0)
        }
      } catch {}
    })()
    return () => { ignore = true }
  }, [])

  const unreadCount = data.notifications.filter(n => !n.read).length
  const urgentNotifications = data.notifications.filter(n => n.type === 'urgent' && !n.read)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertTriangle
      case 'error': return AlertCircle  
      case 'warning': return AlertCircle
      case 'success': return CheckCircle
      default: return Bell
    }
  }

  return (
    <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-6 shadow-sm border">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Badge variant={data.systemHealth.overall === 'healthy' ? 'default' : 'destructive'} className="text-xs">
            System {data.systemHealth.overall}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>•</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          {autoRefresh && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Live</span>
              </div>
            </>
          )}
          {rtTransport && (
            <>
              <span>•</span>
              <span className="text-sm text-gray-600">Realtime: {rtTransport}{rtConn ? ` (${rtConn})` : ''}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">View:</label>
          <select 
            value={dashboardView} 
            onChange={(e) => setDashboardView(e.target.value as 'overview' | 'detailed')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onToggleAutoRefresh}
        >
          {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Auto-refresh
        </Button>
        
        <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>

        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        
        <div className="relative">
          <Button 
            variant={urgentNotifications.length > 0 ? "destructive" : "outline"}
            size="sm" 
            className="gap-2 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant={urgentNotifications.length > 0 ? "secondary" : "destructive"} 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
          
          {showNotifications && (
            <Card className="absolute right-0 top-12 w-96 z-50 shadow-xl max-h-96 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Notifications</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={onMarkAllRead}>Mark all read</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  {data.notifications.slice(0, 10).map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type)
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            notification.type === 'urgent' ? 'text-red-500' :
                            notification.type === 'error' ? 'text-red-500' :
                            notification.type === 'warning' ? 'text-yellow-500' :
                            notification.type === 'success' ? 'text-green-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm text-gray-900 truncate">{notification.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 leading-tight mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                              {notification.actionRequired && notification.actionUrl && (
                                <Button variant="ghost" size="sm" className="text-xs p-1 h-auto" onClick={(e) => { e.stopPropagation(); router.push(notification.actionUrl!); }}>
                                  Take Action <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-3 border-t bg-gray-50">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    View All Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfessionalKPIGrid({ data }: { data: DashboardData }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('month')
  const [expandedKPI, setExpandedKPI] = useState<string | null>(null)
  const router = useRouter()

  const kpis = [
    {
      id: 'revenue',
      title: 'Revenue Performance',
      mainValue: `$${data.stats.revenue.current.toLocaleString()}`,
      targetValue: `$${data.stats.revenue.target.toLocaleString()}`,
      progress: data.stats.revenue.targetProgress,
      change: data.stats.revenue.trend,
      subtitle: `${data.stats.revenue.targetProgress.toFixed(1)}% of target`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      trend: data.stats.revenue.trend > 0 ? 'up' : 'down',
      drillDown: '/admin/analytics/revenue',
      alerts: []
    },
    {
      id: 'bookings',
      title: 'Booking Performance',
      mainValue: data.stats.bookings.total.toString(),
      secondaryValue: `${data.stats.bookings.conversion.toFixed(1)}% conversion`,
      subtitle: `${data.stats.bookings.today} today • ${data.stats.bookings.pending} pending`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      drillDown: '/admin/bookings',
      alerts: data.stats.bookings.pending > 10 ? ['High pending count'] : []
    },
    {
      id: 'clients',
      title: 'Client Metrics',
      mainValue: data.stats.clients.active.toString(),
      secondaryValue: `${data.stats.clients.retention.toFixed(1)}% retention`,
      subtitle: `${data.stats.clients.new} new • ${data.stats.clients.satisfaction.toFixed(1)}/5 satisfaction`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      drillDown: '/admin/users',
      alerts: data.stats.clients.satisfaction < 4.0 ? ['Low satisfaction score'] : []
    },
    {
      id: 'productivity',
      title: 'Task Management',
      mainValue: `${data.stats.tasks.productivity.toFixed(1)}%`,
      secondaryValue: `${data.stats.tasks.completed} completed`,
      subtitle: `${data.stats.tasks.overdue} overdue • ${data.stats.tasks.dueToday} due today`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      drillDown: '/admin/tasks',
      alerts: data.stats.tasks.overdue > 0 ? [`${data.stats.tasks.overdue} overdue tasks`] : []
    }
  ]

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Period:</label>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value as 'today' | 'week' | 'month')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const IconComponent = kpi.icon
          const isExpanded = expandedKPI === kpi.id
          const hasAlerts = kpi.alerts?.length > 0
          
          return (
            <Card 
              key={kpi.id}
              className={`transition-all duration-200 hover:shadow-lg cursor-pointer group relative ${
                hasAlerts ? `ring-2 ring-red-200 ${kpi.borderColor}` : 'hover:border-gray-300'
              } ${isExpanded ? 'lg:col-span-2' : ''}`}
              onClick={() => router.push(kpi.drillDown)}
            >
              {hasAlerts && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {kpi.alerts.length}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${kpi.bgColor} group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {kpi.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedKPI(isExpanded ? null : kpi.id)
                      }}
                    >
                      {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-gray-600">{kpi.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">{kpi.mainValue}</h3>
                    {kpi.secondaryValue && (
                      <span className="text-sm font-medium text-gray-600">{kpi.secondaryValue}</span>
                    )}
                  </div>
                  
                  {kpi.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Target Progress</span>
                        <span className="font-medium">{kpi.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                        />
                      </div>
                      {kpi.targetValue && (
                        <div className="text-xs text-gray-500">Target: {kpi.targetValue}</div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">{kpi.subtitle}</p>
                  
                  {hasAlerts && (
                    <div className="space-y-1">
                      {kpi.alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded p-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{alert}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center text-xs text-blue-600">
                      View details <ExternalLink className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { useRouter } from 'next/navigation'

function SmartQuickActions({ data }: { data: DashboardData }) {
  const [actionCategory, setActionCategory] = useState<'primary' | 'management' | 'reports'>('primary')
  
  const actions = {
    primary: [
      {
        label: 'New Booking',
        href: '/admin/bookings/new',
        icon: Plus,
        variant: 'default' as const,
        description: 'Schedule client appointment',
        urgent: data.stats.bookings.pending > 15
      },
      {
        label: 'New Service Request',
        href: '/admin/service-requests/new',
        icon: Plus,
        variant: 'outline' as const,
        description: 'Create client request'
      },
      {
        label: 'Add Client',
        href: '/admin/clients/new',
        icon: Users,
        variant: 'outline' as const,
        description: 'Register new client',
        badge: `${data.stats.clients.new} new this month`
      },
      {
        label: 'Quick Task',
        href: '/admin/tasks/new',
        icon: FileText,
        variant: 'outline' as const,
        description: 'Create urgent task',
        urgent: data.stats.tasks.overdue > 0
      }
    ],
    management: [
      {
        label: 'Cron Telemetry',
        href: '/admin/cron-telemetry',
        icon: Activity,
        description: 'Monitor cron runs and metrics'
      },
      {
        label: 'Team Members',
        href: '/admin/team',
        icon: Users,
        description: 'Manage staff & assignments'
      },
      {
        label: 'Analytics Hub',
        href: '/admin/analytics',
        icon: BarChart3,
        description: 'Revenue & performance metrics'
      },
      {
        label: 'Client Portal',
        href: '/admin/users',
        icon: Users,
        description: 'Manage client relationships'
      },
      {
        label: 'Task Manager',
        href: '/admin/tasks',
        icon: Target,
        description: 'Track team productivity'
      },
      {
        label: 'Calendar View',
        href: '/admin/calendar',
        icon: CalendarDays,
        description: 'Schedule overview'
      },
      {
        label: 'Services',
        href: '/admin/services',
        icon: Settings,
        description: 'Create and manage services'
      },
      {
        label: 'Service Requests',
        href: '/admin/service-requests',
        icon: FileText,
        description: 'Manage client requests'
      },
      {
        label: 'Audit Logs',
        href: '/admin/audits',
        icon: Activity,
        description: 'Review system and admin audits'
      },
      {
        label: 'Bookings',
        href: '/admin/bookings',
        icon: Calendar,
        description: 'Manage client appointments'
      },
      {
        label: 'Posts',
        href: '/admin/posts',
        icon: FileText,
        description: 'Manage blog posts'
      },
      {
        label: 'Newsletter',
        href: '/admin/newsletter',
        icon: Mail,
        description: 'Manage newsletter subscribers'
      }
    ],
    reports: [
      { 
        label: 'Revenue Report', 
        href: '/admin/reports/revenue', 
        icon: DollarSign,
        description: 'Financial performance'
      },
      { 
        label: 'Client Report', 
        href: '/admin/reports/clients', 
        icon: Users,
        description: 'Client analytics'
      },
      { 
        label: 'Tax Deadlines', 
        href: '/admin/deadlines', 
        icon: Clock,
        description: 'Compliance calendar',
        urgent: data.upcomingDeadlines.some(d => d.status === 'due_soon')
      },
      { 
        label: 'System Health', 
        href: '/admin/system', 
        icon: Activity,
        description: 'Technical monitoring'
      }
    ]
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Smart Actions</CardTitle>
            <CardDescription>Contextual shortcuts based on current activity</CardDescription>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(Object.keys(actions) as Array<keyof typeof actions>).map((category) => (
              <Button
                key={category}
                variant={actionCategory === category ? 'default' : 'ghost'}
                size="sm"
                className="text-xs capitalize"
                onClick={() => setActionCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions[actionCategory].map((action, index) => {
            const IconComponent = action.icon
            return (
              <Link
                key={index}
                href={action.href}
                className={`relative group border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                  ('urgent' in action && action.urgent) ? 'border-red-200 bg-red-50 hover:border-red-300' : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={action.label}
              >
                {'urgent' in action && action.urgent && (
                  <div className="absolute -top-1 -right-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`p-3 rounded-lg ${('urgent' in action && action.urgent) ? 'bg-red-100' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-5 w-5 ${('urgent' in action && action.urgent) ? 'text-red-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-900">{action.label}</h3>
                    {action.description && (
                      <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                    )}
                    {'badge' in action && action.badge && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceRequestsSummary() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    total: number;
    newThisWeek: number;
    completedThisMonth: number;
    pipelineValue: number;
    statusDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    activeRequests: number;
    completionRate: number;
  } | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await fetch('/api/admin/service-requests/analytics')
        const j = await r.json().catch(() => null)
        if (!ignore) {
          if (j && j.data) setData(j.data)
          else setData(null)
          setError(null)
        }
      } catch (e) {
        if (!ignore) setError('Failed to load service requests analytics')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  const pieData: ChartData<'pie'> | null = data ? {
    labels: Object.keys(data.statusDistribution || {}),
    datasets: [
      {
        label: 'Requests',
        data: Object.values(data.statusDistribution || {}),
        backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#22c55e','#eab308','#94a3b8'],
        borderWidth: 1,
      }
    ]
  } : null

  const pieOptions: ChartOptions<'pie'> = { plugins: { legend: { position: 'bottom' } } }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Requests</CardTitle>
            <CardDescription>Work in progress across client requests</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (<div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-gray-600">Active</div>
                <div className="text-2xl font-bold">{data.activeRequests}</div>
                <div className="text-xs text-gray-500">of {data.total} total</div>
              </div>
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-gray-600">New This Week</div>
                <div className="text-2xl font-bold">{data.newThisWeek}</div>
              </div>
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-gray-600">Completion Rate</div>
                <div className="text-2xl font-bold">{data.completionRate}%</div>
              </div>
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-gray-600">Pipeline Value</div>
                <div className="text-2xl font-bold">${Number(data.pipelineValue || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              {pieData ? <Pie data={pieData} options={pieOptions} /> : (
                <div className="h-40 bg-gray-100 rounded" />
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TeamWorkloadSummary() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ utilization: number; activeMembers: number; distribution: Array<{ memberId: string; assigned: number; inProgress: number; completed: number }> } | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await fetch('/api/admin/team-management/workload')
        const j = await r.json().catch(() => null)
        if (!ignore) {
          if (j && j.data) setData(j.data)
          else setData({ utilization: 0, activeMembers: 0, distribution: [] })
          setError(null)
        }
      } catch (e) {
        if (!ignore) setError('Failed to load team workload')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Utilization based on active assignments</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Utilization</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(Math.max(data.utilization, 0), 100)}%` }} />
              </div>
              <div className="text-sm font-medium">{data.utilization}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Active Members</div>
              <div className="text-2xl font-bold">{data.activeMembers}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Active Assignments</div>
              <div className="flex flex-wrap gap-2">
                {data.distribution.slice(0, 5).map((d) => (
                  <Badge key={d.memberId} variant="outline" className="text-xs">
                    {d.memberId.slice(0, 6)} • {d.assigned + d.inProgress}
                  </Badge>
                ))}
                {data.distribution.length === 0 && (
                  <span className="text-sm text-gray-500">No assignments</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}


function EnhancedSystemHealth({ data, thresholds, history, saveThresholds }: { data: DashboardData; thresholds: { responseTime: number; errorRate: number; storageGrowth: number }; history?: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }[] | { entries: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }[] } | { data: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }[] }; saveThresholds?: (t: { responseTime: number; errorRate: number; storageGrowth: number }) => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const healthSections = [
    {
      key: 'database',
      title: 'Database',
      status: data.systemHealth.database.status,
      metrics: [
        { label: 'Response Time', value: `${data.systemHealth.database.responseTime}ms`, good: data.systemHealth.database.responseTime < (thresholds?.responseTime ?? 100) },
        { label: 'Connections', value: data.systemHealth.database.connections.toString(), good: true },
        { label: 'Last Backup', value: new Date(data.systemHealth.database.lastBackup).toLocaleDateString(), good: true }
      ]
    },
    {
      key: 'api',
      title: 'API Services',
      status: data.systemHealth.api.status,
      metrics: [
        { label: 'Uptime', value: `${data.systemHealth.api.uptime}%`, good: data.systemHealth.api.uptime > 99 },
        { label: 'Avg Response', value: `${data.systemHealth.api.averageResponseTime}ms`, good: data.systemHealth.api.averageResponseTime < 200 },
        { label: 'Error Rate', value: `${data.systemHealth.api.errorRate}%`, good: data.systemHealth.api.errorRate < (thresholds?.errorRate ?? 1) }
      ]
    },
    {
      key: 'email',
      title: 'Email Service',
      status: data.systemHealth.email.status,
      metrics: [
        { label: 'Delivery Rate', value: `${data.systemHealth.email.deliveryRate}%`, good: data.systemHealth.email.deliveryRate > 95 },
        { label: 'Bounce Rate', value: `${data.systemHealth.email.bounceRate}%`, good: data.systemHealth.email.bounceRate < 5 },
        { label: 'Last Sent', value: new Date(data.systemHealth.email.lastSent).toLocaleTimeString(), good: true }
      ]
    },
    {
      key: 'storage',
      title: 'Storage',
      status: data.systemHealth.storage.status,
      metrics: [
        { label: 'Used', value: `${data.systemHealth.storage.used}GB / ${data.systemHealth.storage.total}GB`, good: data.systemHealth.storage.used < data.systemHealth.storage.total * 0.8 },
        { label: 'Growth', value: `${data.systemHealth.storage.growth}% monthly`, good: data.systemHealth.storage.growth < (thresholds?.storageGrowth ?? 20) }
      ]
    },
    {
      key: 'security',
      title: 'Security',
      status: data.systemHealth.security.status,
      metrics: [
        { label: 'Failed Logins', value: data.systemHealth.security.failedLogins.toString(), good: data.systemHealth.security.failedLogins < 5 },
        { label: 'Vulnerabilities', value: data.systemHealth.security.vulnerabilities.toString(), good: data.systemHealth.security.vulnerabilities === 0 },
        { label: 'Last Scan', value: new Date(data.systemHealth.security.lastSecurityScan).toLocaleDateString(), good: true }
      ]
    }
  ]

  const overallHealthScore = healthSections.reduce((score, section) => {
    if (section.status === 'healthy') return score + 20
    if (section.status === 'warning') return score + 15
    return score + 10
  }, 0)

  const hist = Array.isArray(history)
    ? history
    : history && typeof history === 'object' && 'entries' in history && Array.isArray((history as { entries: unknown }).entries)
      ? (history as { entries: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }[] }).entries
      : history && typeof history === 'object' && 'data' in history && Array.isArray((history as { data: unknown }).data)
        ? (history as { data: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }[] }).data
        : undefined

  const [showConfig, setShowConfig] = useState(false)
  const [formValues, setFormValues] = useState(() => ({ responseTime: thresholds?.responseTime ?? 100, errorRate: thresholds?.errorRate ?? 1, storageGrowth: thresholds?.storageGrowth ?? 20 }))

  const applyConfig = () => {
    if (saveThresholds) saveThresholds(formValues)
    try { localStorage.setItem('admin_health_thresholds', JSON.stringify(formValues)) } catch {}
    setShowConfig(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time monitoring</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              overallHealthScore >= 95 ? 'text-green-600' :
              overallHealthScore >= 85 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {overallHealthScore}%
            </div>
            <div className="text-xs text-gray-500">Health Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(v => !v)}>
                Configure Thresholds
              </Button>
            </div>
          </div>
          {showConfig && (
            <div className="mb-3 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-600">DB resp. threshold (ms)</label>
                  <input type="number" value={formValues.responseTime} onChange={(e) => setFormValues(v => ({ ...v, responseTime: Number(e.target.value) }))} className="w-full border rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">API error % threshold</label>
                  <input type="number" value={formValues.errorRate} onChange={(e) => setFormValues(v => ({ ...v, errorRate: Number(e.target.value) }))} className="w-full border rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Storage growth %</label>
                  <input type="number" value={formValues.storageGrowth} onChange={(e) => setFormValues(v => ({ ...v, storageGrowth: Number(e.target.value) }))} className="w-full border rounded px-2 py-1 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" onClick={() => setShowConfig(false)} variant="ghost">Cancel</Button>
                <Button size="sm" onClick={applyConfig}>Save</Button>
              </div>
            </div>
          )}

          {hist && hist.length > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Historical Metrics</div>
                <div className="text-xs text-gray-500">Last {hist?.length ?? 0} entries</div>
              </div>
              <div className="h-40">
                <Line
                  data={{
                    labels: hist.map((h: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }) => new Date(h.timestamp).toLocaleTimeString()),
                    datasets: [
                      { label: 'DB Response (ms)', data: hist.map((h: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }) => h.databaseResponseTime), borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.2)', tension: 0.3 },
                      { label: 'API Error Rate (%)', data: hist.map((h: { timestamp: string; databaseResponseTime: number; apiErrorRate: number }) => h.apiErrorRate), borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.15)', tension: 0.3 }
                    ]
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }}}
                />
              </div>
            </div>
          )}

          {healthSections.map((section) => {
            const isExpanded = expandedSection === section.key
            const StatusIcon = section.status === 'healthy' ? CheckCircle : AlertCircle

            return (
              <div key={section.key} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${
                      section.status === 'healthy' ? 'text-green-500' :
                      section.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                    <span className="font-medium text-sm">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        section.status === 'healthy' ? 'default' :
                        section.status === 'warning' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {section.status}
                    </Badge>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {section.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{metric.label}:</span>
                        <span className={`font-medium ${metric.good ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <Button variant="outline" size="sm" className="w-full mt-4">
            <Activity className="h-4 w-4 mr-2" />
            Detailed System Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


export default function ProfessionalAdminDashboard() {
  const zeroStats: DashboardStats = {
    revenue: { current: 0, previous: 0, trend: 0, target: 0, targetProgress: 0 },
    bookings: { total: 0, today: 0, thisWeek: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, conversion: 0 },
    clients: { total: 0, new: 0, active: 0, inactive: 0, retention: 0, satisfaction: 0 },
    tasks: { total: 0, overdue: 0, dueToday: 0, completed: 0, inProgress: 0, productivity: 0 }
  }
  const initialDashboardData: DashboardData = { ...({} as any), stats: zeroStats, recentBookings: [], urgentTasks: [], notifications: [], systemHealth: {
    overall: 'healthy',
    database: { status: 'healthy', responseTime: 0, connections: 0, lastBackup: '' },
    email: { status: 'healthy', deliveryRate: 0, bounceRate: 0, lastSent: '' },
    api: { status: 'healthy', uptime: 0, averageResponseTime: 0, errorRate: 0 },
    storage: { status: 'healthy', used: 0, total: 0, growth: 0 },
    security: { status: 'healthy', failedLogins: 0, lastSecurityScan: '', vulnerabilities: 0 }
  }, revenueAnalytics: { dailyRevenue: [], monthlyTrend: [], serviceBreakdown: [], clientSegments: [], forecastData: [] }, clientInsights: { topClients: [], satisfactionTrends: [], retentionMetrics: { newClients: 0, returningClients: 0, churnRate: 0, lifetimeValue: 0 }, geographicDistribution: [] }, upcomingDeadlines: [], performanceMetrics: { efficiency: { bookingUtilization: 0, averageSessionDuration: 0, clientSatisfaction: 0, taskCompletionRate: 0 }, growth: { monthOverMonth: 0, yearOverYear: 0, newClientAcquisition: 0, revenuePerClient: 0 }, operational: { averageResponseTime: 0, firstCallResolution: 0, appointmentShowRate: 0, reschedulingRate: 0 } } }

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'bookings'|'clients'|'revenue'>('overview')
  const [filters, setFilters] = useState<{ dateRange: 'today'|'week'|'month'|'year'; status: string }>({ dateRange: 'month', status: 'all' })

  // Configurable thresholds (fetched from server)
  const [thresholds, setThresholds] = useState<{ responseTime: number; errorRate: number; storageGrowth: number }>({ responseTime: 100, errorRate: 1, storageGrowth: 20 })
  const { data: thresholdsData, mutate: mutateThresholds } = useSWR('/api/admin/thresholds', fetcher)

  useEffect(() => {
    if (thresholdsData) {
      setThresholds({ responseTime: thresholdsData.responseTime ?? 100, errorRate: thresholdsData.errorRate ?? 1, storageGrowth: thresholdsData.storageGrowth ?? 20 })
      try { localStorage.setItem('admin_health_thresholds', JSON.stringify(thresholdsData)) } catch {}
    } else {
      // fallback to localStorage
      try {
        const saved = localStorage.getItem('admin_health_thresholds')
        if (saved) setThresholds(JSON.parse(saved))
      } catch {}
    }
  }, [thresholdsData])

  const saveThresholds = async (t: { responseTime: number; errorRate: number; storageGrowth: number }) => {
    setThresholds(t)
    try { localStorage.setItem('admin_health_thresholds', JSON.stringify(t)) } catch {}
    try {
      const res = await fetch('/api/admin/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) })
      if (res.ok) {
        const json = await res.json()
        mutateThresholds(json, { revalidate: true })
      }
    } catch (err) {
      console.error('Failed to save thresholds to server', err)
    }
  }

  // Fetch historical health metrics
  const { data: history } = useSWR('/api/admin/health-history', fetcher)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingsRes, usersRes, tasksRes, bookingsListRes] = await Promise.allSettled([
        fetch('/api/admin/stats/bookings?range=7d'),
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/tasks?limit=50'),
        fetch('/api/admin/bookings?limit=20&offset=0&sortBy=scheduledAt&sortOrder=desc')
      ])

      const okJson = async (r: PromiseSettledResult<Response>) => {
        if (r.status === 'fulfilled' && r.value.ok) return r.value.json()
        return null
      }

      const [bookings, users, tasks, adminBookings] = await Promise.all([
        okJson(bookingsRes),
        okJson(usersRes),
        okJson(tasksRes),
        okJson(bookingsListRes)
      ])

      setDashboardData((prev) => {
        const base = prev || initialDashboardData

        const totalBookings = Number(bookings?.total ?? base.stats.bookings.total) || 0
        const completedBookings = Number(bookings?.completed ?? base.stats.bookings.completed) || 0
        const confirmedBookings = Number(bookings?.confirmed ?? base.stats.bookings.confirmed) || 0
        const pendingBookings = Number(bookings?.pending ?? base.stats.bookings.pending) || 0
        const cancelledBookings = Number(bookings?.cancelled ?? base.stats.bookings.cancelled) || 0
        const todayBookings = Number(bookings?.today ?? base.stats.bookings.today) || 0
        const thisWeekBookings = Number(bookings?.range?.bookings ?? base.stats.bookings.thisWeek) || 0
        const conversion = totalBookings > 0 ? ((completedBookings + confirmedBookings) / totalBookings) * 100 : 0

        const clientsTotal = Number(users?.clients ?? base.stats.clients.total) || 0
        const newClients = Number(users?.newThisMonth ?? base.stats.clients.new) || 0
        const activeClients = Number(users?.activeUsers ?? base.stats.clients.active) || 0
        const inactiveClients = Math.max(clientsTotal - activeClients, 0)
        const retention = clientsTotal > 0 ? (activeClients / clientsTotal) * 100 : 0
        const satisfaction = base.stats.clients.satisfaction

        const list = Array.isArray(tasks) ? tasks as Array<{ status?: string; dueAt?: string | null }> : []
        const now = new Date()
        const tasksTotal = list.length
        const tasksCompleted = list.filter(t => t.status === 'DONE').length
        const tasksInProgress = list.filter(t => t.status === 'IN_PROGRESS').length
        const tasksOverdue = list.filter(t => t.dueAt && new Date(t.dueAt) < now && t.status !== 'DONE').length
        const tasksDueToday = list.filter(t => {
          if (!t.dueAt) return false
          const d = new Date(t.dueAt)
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
        }).length
        const productivity = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0

        const revenueCurrent = Number(bookings?.revenue?.thisMonth ?? base.stats.revenue.current) || 0
        const revenuePrevious = Number(bookings?.revenue?.lastMonth ?? base.stats.revenue.previous) || 0
        const revenueTrend = Number(bookings?.revenue?.growth ?? base.stats.revenue.trend) || 0
        const revenueTarget = revenueCurrent
        const targetProgress = revenueCurrent > 0 ? 100 : 0

        const mappedRecent: Booking[] = isAdminBookingsList(adminBookings)
          ? adminBookings.bookings.map((b) => ({
              id: b.id,
              clientId: b.clientId || 'unknown',
              clientName: b.clientName || b.client?.name || 'Client',
              clientEmail: b.clientEmail || b.client?.email || '',
              clientPhone: b.clientPhone || undefined,
              service: b.service?.name || 'Service',
              serviceCategory: b.service?.name || 'General',
              scheduledAt: typeof b.scheduledAt === 'string' ? b.scheduledAt : new Date(b.scheduledAt).toISOString(),
              duration: Number(b.duration || 60),
              status: String(b.status || 'CONFIRMED').toLowerCase() as Booking['status'],
              revenue: toNumberish(b.service?.price),
              priority: 'normal',
              location: 'office',
              assignedTo: undefined,
              notes: b.notes || undefined,
              isRecurring: false,
              source: 'direct'
            }))
          : base.recentBookings

        return {
          ...base,
          recentBookings: mappedRecent,
          stats: {
            revenue: {
              current: revenueCurrent,
              previous: revenuePrevious,
              trend: revenueTrend,
              target: revenueTarget,
              targetProgress: targetProgress
            },
            bookings: {
              total: totalBookings,
              today: todayBookings,
              thisWeek: thisWeekBookings,
              pending: pendingBookings,
              confirmed: confirmedBookings,
              completed: completedBookings,
              cancelled: cancelledBookings,
              conversion
            },
            clients: {
              total: clientsTotal,
              new: newClients,
              active: activeClients,
              inactive: inactiveClients,
              retention,
              satisfaction
            },
            tasks: {
              total: tasksTotal,
              overdue: tasksOverdue,
              dueToday: tasksDueToday,
              completed: tasksCompleted,
              inProgress: tasksInProgress,
              productivity
            }
          }
        }
      })
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard data. Please check your connection and try again.')
      console.error('Dashboard data loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggleAutoRefresh = () => setAutoRefresh(v => !v)
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleMarkAllRead = () => {
    setDashboardData(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) }))
  }

  // Live updates via SSE
  useEffect(() => {
    if (!autoRefresh) return
    const es = new EventSource('/api/admin/updates')

    es.addEventListener('booking_update', (ev) => {
      try {
        const dataRaw = JSON.parse((ev as MessageEvent).data) as unknown
        const data = dataRaw as BookingUpdateEvent
        const newBooking: Booking = {
          id: data.id,
          clientId: 'live',
          clientName: data.clientName || 'Live Client',
          clientEmail: 'live@example.com',
          service: data.service || 'Service',
          serviceCategory: 'Live',
          scheduledAt: data.scheduledAt,
          duration: data.duration || 60,
          status: (data.status || 'confirmed') as Booking['status'],
          revenue: Number(data.revenue || 0),
          priority: (data.priority || 'normal') as Booking['priority'],
          location: (data.location || 'office') as Booking['location'],
          isRecurring: false,
          source: 'direct'
        }
        setDashboardData(prev => ({ ...prev, recentBookings: [newBooking, ...prev.recentBookings].slice(0, 20) }))
      } catch {}
    })

    es.addEventListener('task_completed', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as unknown as TaskCompletedEvent
        setDashboardData(prev => ({
          ...prev,
          urgentTasks: prev.urgentTasks.map(t => t.id === data.id ? { ...t, status: 'completed', completionPercentage: 100 } : t)
        }))
      } catch {}
    })

    es.addEventListener('system_alert', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as unknown as SystemAlertEvent
        const notif: Notification = {
          id: data.id,
          type: (data.severity || 'info') as Notification['type'],
          category: 'system',
          title: data.title || 'System Alert',
          message: data.message || 'Update received',
          timestamp: new Date().toISOString(),
          read: false,
          actionRequired: false,
          priority: 5,
        }
        setDashboardData(prev => ({ ...prev, notifications: [notif, ...prev.notifications].slice(0, 50) }))
      } catch {}
    })

    es.onerror = () => {
      es.close()
    }

    return () => es.close()
  }, [autoRefresh])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadDashboardData, 300000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadDashboardData])

  const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'bookings', label: 'Bookings', count: dashboardData?.stats?.bookings?.total ?? 0 },
    { key: 'clients', label: 'Clients', count: dashboardData?.stats?.clients?.total ?? 0 },
    { key: 'revenue', label: 'Revenue' },
  ]

  const filterConfigs: FilterConfig[] = [
    { key: 'dateRange', label: 'Date Range', options: [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'year', label: 'This Year' },
    ], value: filters.dateRange },
    { key: 'status', label: 'Status', options: [
      { value: 'all', label: 'All Status' },
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ], value: filters.status },
  ]

  const onFilterChange = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value as any }))

  function withinRange(dateISO: string, range: 'today'|'week'|'month'|'year') {
    const d = new Date(dateISO)
    const now = new Date()
    if (range === 'today') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    }
    if (range === 'week') {
      const diffMs = now.getTime() - d.getTime()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      return diffMs >= 0 && diffMs <= weekMs
    }
    if (range === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }
    if (range === 'year') {
      return d.getFullYear() === now.getFullYear()
    }
    return true
  }

  function rangeToDates(range: 'today'|'week'|'month'|'year') {
    const now = new Date()
    const start = new Date(now)
    if (range === 'today') {
      start.setHours(0,0,0,0)
    } else if (range === 'week') {
      start.setDate(now.getDate() - 7)
    } else if (range === 'month') {
      start.setDate(1); start.setHours(0,0,0,0)
    } else if (range === 'year') {
      start.setMonth(0,1); start.setHours(0,0,0,0)
    }
    return { startDate: start.toISOString(), endDate: now.toISOString() }
  }

  const bookingQuery = useMemo(() => {
    if (activeTab !== 'bookings') return null
    const params = new URLSearchParams()
    params.set('limit', '50')
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    const { startDate, endDate } = rangeToDates(filters.dateRange)
    params.set('startDate', startDate)
    params.set('endDate', endDate)
    return `/api/admin/bookings?${params.toString()}`
  }, [activeTab, filters])

  const { data: bookingsApi, isLoading: bookingsLoading } = useSWR(bookingQuery, fetcher)
  const bookingsList = isAdminBookingsList(bookingsApi) ? bookingsApi.bookings : []

  type BookingRow = { id: string; clientName: string; service: string; scheduledAt: string; status: string; revenue: number }
  const bookingRows: BookingRow[] = bookingsList.map((b) => ({
    id: b.id,
    clientName: b.clientName || b.client?.name || 'Client',
    service: b.service?.name || 'Service',
    scheduledAt: typeof b.scheduledAt === 'string' ? b.scheduledAt : new Date(b.scheduledAt).toISOString(),
    status: String(b.status || 'CONFIRMED').toLowerCase(),
    revenue: toNumberish(b.service?.price),
  }))
  const bookingColumns: Column<BookingRow>[] = [
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'service', label: 'Service', sortable: true },
    { key: 'scheduledAt', label: 'Date & Time', sortable: true, render: (v) => new Date(v).toLocaleString() },
    { key: 'status', label: 'Status' },
    { key: 'revenue', label: 'Amount', align: 'right', sortable: true, render: (v) => `$${Number(v||0).toLocaleString()}` },
  ]

  type ClientRow = { id: string; name: string; revenue: number; bookings: number; lastBooking: string; tier: string }
  const clientRows: ClientRow[] = (dashboardData.clientInsights?.topClients || []).map(c => ({ id: c.id, name: c.name, revenue: c.revenue, bookings: c.bookings, lastBooking: c.lastBooking, tier: c.tier }))
  const clientColumns: Column<ClientRow>[] = [
    { key: 'name', label: 'Client', sortable: true },
    { key: 'bookings', label: 'Bookings', align: 'center', sortable: true },
    { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (v) => `$${Number(v||0).toLocaleString()}` },
    { key: 'lastBooking', label: 'Last Booking', sortable: true },
    { key: 'tier', label: 'Tier' },
  ]

  return (
    <AnalyticsPage
      title="Admin Overview"
      subtitle="Accounting & Bookings"
      primaryAction={{ label: 'Export', onClick: handleExport }}
      secondaryActions={[
        { label: autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh', onClick: handleToggleAutoRefresh },
        { label: 'Refresh Now', onClick: loadDashboardData }
      ]}
      filters={filterConfigs}
      onFilterChange={onFilterChange}
      loading={loading}
      error={error}
      stats={dashboardData.stats as any}
      revenueTrend={dashboardData.revenueAnalytics?.monthlyTrend}
    >
      <div className="mt-6">
        <BusinessIntelligence dashboard={dashboardData} />
      </div>
      <div className="mt-6">
        <IntelligentActivityFeed data={dashboardData} thresholds={thresholds} history={history} saveThresholds={saveThresholds} />
      </div>
    </AnalyticsPage>
  )

  if (loading) {
    return (
      
        <div className="animate-pulse space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-64"></div>
                  <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
        </div>
      
    )
  }

  if (error) {
    return (
      
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">Dashboard Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
              <Button variant="outline" onClick={() => console.log('Contact support')}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      
    )
  }

  return (
    
      <div className="space-y-8">
        <ProfessionalHeader
          data={dashboardData}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          onRefresh={loadDashboardData}
          onExport={handleExport}
          onMarkAllRead={handleMarkAllRead}
        />
        <PrimaryTabs tabs={tabs} active={activeTab} onChange={(key) => setActiveTab(key as 'overview' | 'bookings' | 'clients' | 'revenue')} />
        {activeTab === 'overview' && (
          <>
            <AdminKPIGrid stats={dashboardData.stats} />
        <SmartQuickActions data={dashboardData} />
        <ServiceRequestsSummary />
        <TeamWorkloadSummary />
        <IntelligentActivityFeed data={dashboardData} thresholds={thresholds} history={history} saveThresholds={saveThresholds} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business Intelligence</CardTitle>
                <CardDescription>Advanced analytics and performance insights</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Full Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <BusinessIntelligence dashboard={dashboardData} />
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <span>•</span>
              <span>Data refreshes every 5 minutes</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Customize View
              </Button>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            <FilterBar filters={filterConfigs} onFilterChange={onFilterChange} />
            <AdvancedDataTable columns={bookingColumns} rows={bookingRows} loading={bookingsLoading} />
          </>
        )}

        {activeTab === 'clients' && (
          <AdvancedDataTable columns={clientColumns} rows={clientRows} loading={loading} />
        )}

        {activeTab === 'revenue' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Business Intelligence</CardTitle>
                  <CardDescription>Advanced analytics and performance insights</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Full Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BusinessIntelligence dashboard={dashboardData} />
            </CardContent>
          </Card>
        )}
      </div>
    
  )
}
