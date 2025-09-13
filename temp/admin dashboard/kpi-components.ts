// components/dashboard/kpi/KPIGrid.tsx
import React, { memo } from 'react'
import { KPICard } from './KPICard'
import { useKPIMetrics, useDashboardStore } from '@/stores/dashboardStore'
import { DollarSign, Calendar, Users, Target } from 'lucide-react'

const KPI_CONFIG = [
  {
    id: 'revenue',
    title: 'Revenue Performance',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    drillDown: '/admin/analytics/revenue',
  },
  {
    id: 'bookings',
    title: 'Booking Performance',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    drillDown: '/admin/bookings',
  },
  {
    id: 'clients',
    title: 'Client Metrics',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    drillDown: '/admin/users',
  },
  {
    id: 'productivity',
    title: 'Task Management',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    drillDown: '/admin/tasks',
  },
] as const

export const KPIGrid: React.FC = memo(() => {
  const stats = useKPIMetrics()
  const { selectedTimeframe, setTimeframe } = useDashboardStore()

  if (!stats) {
    return <KPIGridSkeleton />
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Period:</label>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setTimeframe(e.target.value as 'today' | 'week' | 'month')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_CONFIG.map((config) => (
          <KPICard
            key={config.id}
            config={config}
            stats={stats}
          />
        ))}
      </div>
    </div>
  )
})

KPIGrid.displayName = 'KPIGrid'

// components/dashboard/kpi/KPICard.tsx
import React, { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, TrendingDown, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import { TrendIndicator } from './TrendIndicator'
import { MetricProgress } from './MetricProgress'
import { useDashboardStore } from '@/stores/dashboardStore'

interface KPIConfig {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  drillDown: string
}

interface KPICardProps {
  config: KPIConfig
  stats: any // Replace with proper typing
}

export const KPICard: React.FC<KPICardProps> = memo(({ config, stats }) => {
  const router = useRouter()
  const { expandedKPI, setExpandedKPI } = useDashboardStore()
  
  const IconComponent = config.icon
  const isExpanded = expandedKPI === config.id
  
  // Calculate metrics based on config.id
  const metrics = getMetricsForKPI(config.id, stats)
  const hasAlerts = metrics.alerts?.length > 0

  const handleCardClick = () => {
    router.push(config.drillDown)
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedKPI(isExpanded ? null : config.id)
  }

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg cursor-pointer group relative ${
        hasAlerts ? `ring-2 ring-red-200 ${config.borderColor}` : 'hover:border-gray-300'
      } ${isExpanded ? 'lg:col-span-2' : ''}`}
      onClick={handleCardClick}
    >
      {hasAlerts && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
            {metrics.alerts.length}
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${config.bgColor} group-hover:scale-110 transition-transform`}>
            <IconComponent className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex items-center gap-2">
            {metrics.trend !== undefined && (
              <TrendIndicator trend={metrics.trend} />
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
              onClick={handleExpandClick}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-600">{config.title}</h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-gray-900">{metrics.mainValue}</h4>
            {metrics.secondaryValue && (
              <span className="text-sm font-medium text-gray-600">{metrics.secondaryValue}</span>
            )}
          </div>
          
          {metrics.progress !== undefined && (
            <MetricProgress 
              progress={metrics.progress}
              target={metrics.targetValue}
            />
          )}
          
          <p className="text-sm text-gray-600">{metrics.subtitle}</p>
          
          {hasAlerts && (
            <div className="space-y-1">
              {metrics.alerts.map((alert: string, idx: number) => (
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
})

KPICard.displayName = 'KPICard'

// components/dashboard/kpi/TrendIndicator.tsx
interface TrendIndicatorProps {
  trend: number
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = memo(({ trend }) => {
  const isPositive = trend > 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className="flex items-center gap-1">
      <Icon className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
      <span className={`text-sm font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
      </span>
    </div>
  )
})

TrendIndicator.displayName = 'TrendIndicator'

// components/dashboard/kpi/MetricProgress.tsx
interface MetricProgressProps {
  progress: number
  target?: string
}

export const MetricProgress: React.FC<MetricProgressProps> = memo(({ progress, target }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Target Progress</span>
        <span className="font-medium">{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {target && (
        <div className="text-xs text-gray-500">Target: {target}</div>
      )}
    </div>
  )
})

MetricProgress.displayName = 'MetricProgress'

// Helper function to extract metrics based on KPI type
function getMetricsForKPI(kpiId: string, stats: any) {
  switch (kpiId) {
    case 'revenue':
      return {
        mainValue: `$${stats.revenue.current.toLocaleString()}`,
        targetValue: `$${stats.revenue.target.toLocaleString()}`,
        progress: stats.revenue.targetProgress,
        trend: stats.revenue.trend,
        subtitle: `${stats.revenue.targetProgress.toFixed(1)}% of target`,
        secondaryValue: undefined,
        alerts: []
      }
    
    case 'bookings':
      return {
        mainValue: stats.bookings.total.toString(),
        secondaryValue: `${stats.bookings.conversion.toFixed(1)}% conversion`,
        subtitle: `${stats.bookings.today} today • ${stats.bookings.pending} pending`,
        progress: undefined,
        trend: undefined,
        alerts: stats.bookings.pending > 10 ? ['High pending count'] : []
      }
    
    case 'clients':
      return {
        mainValue: stats.clients.active.toString(),
        secondaryValue: `${stats.clients.retention.toFixed(1)}% retention`,
        subtitle: `${stats.clients.new} new • ${stats.clients.satisfaction.toFixed(1)}/5 satisfaction`,
        progress: undefined,
        trend: undefined,
        alerts: stats.clients.satisfaction < 4.0 ? ['Low satisfaction score'] : []
      }
    
    case 'productivity':
      return {
        mainValue: `${stats.tasks.productivity.toFixed(1)}%`,
        secondaryValue: `${stats.tasks.completed} completed`,
        subtitle: `${stats.tasks.overdue} overdue • ${stats.tasks.dueToday} due today`,
        progress: undefined,
        trend: undefined,
        alerts: stats.tasks.overdue > 0 ? [`${stats.tasks.overdue} overdue tasks`] : []
      }
    
    default:
      return {
        mainValue: '0',
        subtitle: 'No data',
        alerts: []
      }
  }
}

// Skeleton component for loading state
const KPIGridSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-64"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}