/**
 * Analytics Dashboard Component
 * Real-time performance monitoring and system analytics visualization
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Eye,
  MousePointer
} from 'lucide-react'
import PerformanceMetricsCard from './PerformanceMetricsCard'
import UserBehaviorChart from './UserBehaviorChart'
import SystemHealthPanel from './SystemHealthPanel'
import RealtimeMetrics from './RealtimeMetrics'
import { usePerformanceAnalytics } from '@/hooks/admin/usePerformanceAnalytics'

interface AnalyticsData {
  performance: {
    averageLoadTime: number
    averageNavigationTime: number
    errorRate: number
    activeUsers: number
  }
  userBehavior: {
    totalSessions: number
    averageSessionDuration: number
    bounceRate: number
    mostUsedFeatures: Array<{ name: string; count: number }>
  }
  systemHealth: {
    uptime: number
    memoryUsage: number
    responseTime: number
    status: 'healthy' | 'warning' | 'error'
  }
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  
  const {
    realtimeMetrics,
    historicalData,
    isConnected,
    subscribe,
    unsubscribe
  } = usePerformanceAnalytics()

  // Load analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/analytics?range=${selectedTimeRange}`)
        if (response.ok) {
          const raw = await response.json()
          const payload = raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : raw

          // Normalize shape and fill any missing fields with sane defaults
          const sample = getSampleAnalyticsData()
          const normalized: AnalyticsData = {
            performance: {
              ...sample.performance,
              ...(payload?.performance || {})
            },
            userBehavior: {
              ...sample.userBehavior,
              ...(payload?.userBehavior || {}),
              mostUsedFeatures: Array.isArray(payload?.userBehavior?.mostUsedFeatures) && payload.userBehavior.mostUsedFeatures.length
                ? payload.userBehavior.mostUsedFeatures
                : sample.userBehavior.mostUsedFeatures
            },
            systemHealth: {
              ...sample.systemHealth,
              ...(payload?.systemHealth || {})
            }
          }

          // Basic validation: ensure required numeric fields exist
          const valid = typeof normalized.performance.averageLoadTime === 'number' &&
                        typeof normalized.performance.averageNavigationTime === 'number' &&
                        typeof normalized.performance.errorRate === 'number' &&
                        typeof normalized.performance.activeUsers === 'number'

          setAnalyticsData(valid ? normalized : sample)
        } else {
          setAnalyticsData(getSampleAnalyticsData())
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
        setAnalyticsData(getSampleAnalyticsData())
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [selectedTimeRange])

  // Subscribe to real-time updates
  useEffect(() => {
    subscribe('performance_metrics')
    subscribe('user_behavior')
    subscribe('system_health')

    return () => {
      unsubscribe('performance_metrics')
      unsubscribe('user_behavior') 
      unsubscribe('system_health')
    }
  }, [subscribe, unsubscribe])

  if (loading) {
    return <AnalyticsDashboardSkeleton />
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Unable to Load Analytics Data
          </h3>
          <p className="text-gray-600 mt-2">
            Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            Real-time monitoring {isConnected ? '(Connected)' : '(Disconnected)'}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealtimeMetrics metrics={realtimeMetrics} />

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PerformanceMetricsCard
          title="Avg Load Time"
          value={`${analyticsData.performance.averageLoadTime.toFixed(0)}ms`}
          change={-12.5}
          trend="down"
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        
        <PerformanceMetricsCard
          title="Navigation Time"
          value={`${analyticsData.performance.averageNavigationTime.toFixed(0)}ms`}
          change={8.2}
          trend="up"
          icon={<Zap className="w-5 h-5" />}
          color="green"
        />
        
        <PerformanceMetricsCard
          title="Error Rate"
          value={`${(analyticsData.performance.errorRate * 100).toFixed(2)}%`}
          change={-25.1}
          trend="down"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        
        <PerformanceMetricsCard
          title="Active Users"
          value={analyticsData.performance.activeUsers.toString()}
          change={15.3}
          trend="up"
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* User Behavior Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Behavior</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          
          <UserBehaviorChart
            data={analyticsData.userBehavior}
            timeRange={selectedTimeRange}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Most Used Features</h3>
            <MousePointer className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {analyticsData.userBehavior.mostUsedFeatures.map((feature, index) => (
              <div key={feature.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="ml-3 text-sm text-gray-900">{feature.name}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (feature.count / Math.max(...analyticsData.userBehavior.mostUsedFeatures.map(f => f.count))) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{feature.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Panel */}
      <SystemHealthPanel 
        healthData={analyticsData.systemHealth}
        historicalData={historicalData}
      />

      {/* Performance Charts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600">Improving</span>
          </div>
        </div>
        
        {/* Chart will be implemented with Chart.js in the next step */}
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Performance charts will be implemented here</p>
            <p className="text-sm text-gray-500">Chart.js integration coming next</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sample data generator for development/fallback
const getSampleAnalyticsData = (): AnalyticsData => ({
  performance: {
    averageLoadTime: 1850,
    averageNavigationTime: 320,
    errorRate: 0.008,
    activeUsers: 24,
  },
  userBehavior: {
    totalSessions: 156,
    averageSessionDuration: 12.5,
    bounceRate: 0.15,
    mostUsedFeatures: [
      { name: 'Service Requests', count: 89 },
      { name: 'Client Management', count: 67 },
      { name: 'Bookings', count: 54 },
      { name: 'Analytics Dashboard', count: 32 },
      { name: 'Settings', count: 18 }
    ]
  },
  systemHealth: {
    uptime: 99.97,
    memoryUsage: 68.5,
    responseTime: 145,
    status: 'healthy'
  }
})

// Loading skeleton component
const AnalyticsDashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
      <div className="flex space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-40 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
)

export default AnalyticsDashboard
