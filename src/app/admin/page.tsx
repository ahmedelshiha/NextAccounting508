'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const router = useRouter()
  
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
      drillDown: '/admin/clients',
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

function IntelligentActivityFeed({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks' | 'deadlines'>('schedule')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredBookings = data.recentBookings.filter(booking => {
    if (filterStatus === 'pending') return booking.status === 'pending'
    if (filterStatus === 'urgent') return booking.priority === 'high' || booking.priority === 'urgent'
    return true
  })

  const prioritizedTasks = [...data.urgentTasks].sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
           (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Center</CardTitle>
              <CardDescription>Real-time business operations</CardDescription>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: 'schedule', label: 'Schedule', count: data.recentBookings.length } as const,
                { key: 'tasks', label: 'Tasks', count: data.urgentTasks.length } as const,
                { key: 'deadlines', label: 'Deadlines', count: data.upcomingDeadlines.length } as const
              ] as const).map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs relative"
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-4 w-4 p-0">
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
          {activeTab === 'schedule' && (
            <div className="flex items-center gap-2 mt-2">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending Only</option>
                <option value="urgent">Urgent Only</option>
              </select>
            </div>
          )}
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                    booking.priority === 'high' || booking.priority === 'urgent' 
                      ? 'border-orange-200 bg-orange-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-500' :
                        booking.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <h3 className="font-medium text-gray-900">{booking.clientName}</h3>
                      {booking.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">High Priority</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{booking.status}</Badge>
                      <span className="text-sm font-medium text-green-600">${booking.revenue}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(booking.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(booking.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{booking.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="capitalize">{booking.location.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                      <strong>Note:</strong> {booking.notes}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Assigned: {booking.assignedTo}</span>
                      <span>Duration: {booking.duration}min</span>
                      {booking.isRecurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {prioritizedTasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date()
                return (
                  <div 
                    key={task.id} 
                    className={`p-4 rounded-lg border transition-all ${
                      isOverdue ? 'border-red-200 bg-red-50' :
                      task.priority === 'critical' || task.priority === 'high' 
                        ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            task.priority === 'critical' ? 'destructive' :
                            task.priority === 'high' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    )}
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{task.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            task.completionPercentage > 75 ? 'bg-green-500' :
                            task.completionPercentage > 50 ? 'bg-blue-500' :
                            task.completionPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${task.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                      <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                      <div>Est: {task.estimatedHours}h</div>
                      <div>Category: {task.category}</div>
                      <div>Assignee: {task.assignee}</div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <Badge variant="outline" className="text-xs">
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                          Update
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {activeTab === 'deadlines' && (
            <div className="space-y-3">
              {data.upcomingDeadlines.map((deadline) => {
                const daysUntilDue = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                const isUrgent = daysUntilDue <= 3
                
                return (
                  <div 
                    key={deadline.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={deadline.importance === 'critical' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {deadline.importance}
                        </Badge>
                        {isUrgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{deadline.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className={isUrgent ? 'text-red-600 font-medium' : ''}>
                          {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                        </span>
                      </div>
                      <div>Client: {deadline.clientName || 'Multiple'}</div>
                      <div>Assigned: {deadline.assignedTo}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{deadline.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${deadline.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <EnhancedSystemHealth data={data} />
    </div>
  )
}

function EnhancedSystemHealth({ data }: { data: DashboardData }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  const healthSections = [
    {
      key: 'database',
      title: 'Database',
      status: data.systemHealth.database.status,
      metrics: [
        { label: 'Response Time', value: `${data.systemHealth.database.responseTime}ms`, good: data.systemHealth.database.responseTime < 100 },
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
        { label: 'Error Rate', value: `${data.systemHealth.api.errorRate}%`, good: data.systemHealth.api.errorRate < 1 }
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
        { label: 'Growth', value: `${data.systemHealth.storage.growth}% monthly`, good: data.systemHealth.storage.growth < 20 }
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

function BusinessIntelligence({ analyticsFallback }: { analyticsFallback: DashboardData }) {
  const { data: analytics, error } = useSWR<AdminAnalyticsResponse>('/api/admin/analytics?range=30d', fetcher, { revalidateOnFocus: false })

  const serviceLabels = (analytics?.revenueByService?.map((s) => s.service) || analyticsFallback.revenueAnalytics.serviceBreakdown.map(s => s.service))
  const serviceValues = (analytics?.revenueByService?.map((s) => s.amount) || analyticsFallback.revenueAnalytics.serviceBreakdown.map(s => s.revenue))
  const pieData: ChartData<'pie', number[], string> = {
    labels: serviceLabels,
    datasets: [{ label: 'Revenue by Service', data: serviceValues, backgroundColor: ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6'], borderWidth: 0 }]
  }
  const pieOptions: ChartOptions<'pie'> = { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }

  const dailyLabels = (analytics?.dailyBookings?.map((d, i: number) => d.date || `D${i+1}`) || analyticsFallback.revenueAnalytics.dailyRevenue.map(d => d.date.slice(5)))
  const dailyValues = (analytics?.dailyBookings?.map((d) => d.count) || analyticsFallback.revenueAnalytics.dailyRevenue.map(d => d.bookings))
  const barData: ChartData<'bar', number[], string> = { labels: dailyLabels, datasets: [{ label: 'Daily Bookings', data: dailyValues, backgroundColor: '#93c5fd' }] }
  const barOptions: ChartOptions<'bar'> = { plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { ticks: { display: false } } } }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Revenue Performance</h3>
        <div className="bg-white rounded-lg border p-4">
          {error ? (<div className="text-sm text-red-600">Analytics unavailable. Showing fallback.</div>) : null}
          <div className="h-56">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            {analyticsFallback.revenueAnalytics.serviceBreakdown.slice(0, 3).map((service, idx) => (
              <div key={idx} className="text-center">
                <div className="font-medium">{service.percentage}%</div>
                <div className="text-gray-600 truncate">{service.service}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Current: ${analyticsFallback.stats.revenue.current.toLocaleString()} • Target: ${analyticsFallback.stats.revenue.target.toLocaleString()} • <span className="text-green-600">+{analyticsFallback.stats.revenue.trend}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Operational Metrics</h3>
        <div className="bg-white rounded-lg border p-4">
          <div className="h-56">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Booking Utilization</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${analyticsFallback.performanceMetrics.efficiency.bookingUtilization}%` }} />
              </div>
              <span className="text-sm font-medium">{analyticsFallback.performanceMetrics.efficiency.bookingUtilization}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Client Satisfaction</span>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{analyticsFallback.performanceMetrics.efficiency.clientSatisfaction}/5.0</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Task Completion Rate</span>
            <span className="text-sm font-medium text-green-600">{analyticsFallback.performanceMetrics.efficiency.taskCompletionRate}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Show Rate</span>
            <span className="text-sm font-medium">{analyticsFallback.performanceMetrics.operational.appointmentShowRate}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfessionalAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Configurable thresholds (persisted in localStorage)
  const [thresholds, setThresholds] = useState<{ responseTime: number; errorRate: number; storageGrowth: number }>(() => {
    try {
      const saved = localStorage.getItem('admin_health_thresholds')
      return saved ? JSON.parse(saved) : { responseTime: 100, errorRate: 1, storageGrowth: 20 }
    } catch { return { responseTime: 100, errorRate: 1, storageGrowth: 20 } }
  })

  const saveThresholds = (t: { responseTime: number; errorRate: number; storageGrowth: number }) => {
    setThresholds(t)
    try { localStorage.setItem('admin_health_thresholds', JSON.stringify(t)) } catch {}
  }

  // Fetch historical health metrics
  const { data: history } = useSWR('/api/admin/health-history', fetcher)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1200))
      setDashboardData(mockDashboardData)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <ProfessionalHeader
          data={dashboardData}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          onRefresh={loadDashboardData}
          onExport={handleExport}
          onMarkAllRead={handleMarkAllRead}
        />
        <ProfessionalKPIGrid data={dashboardData} />
        <SmartQuickActions data={dashboardData} />
        <IntelligentActivityFeed data={dashboardData} thresholds={thresholds} history={history} />
        
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
            <BusinessIntelligence analyticsFallback={dashboardData} />
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
      </div>
    </div>
  )
}
