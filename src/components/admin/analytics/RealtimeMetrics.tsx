/**
 * Real-time Metrics Component
 * Displays live performance metrics with auto-updating values
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

'use client'

import React from 'react'
import { 
  Activity, 
  Zap, 
  Users, 
  Clock,
  Wifi,
  WifiOff,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface RealtimeMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'error'
  lastUpdated: number
}

interface RealtimeMetricsProps {
  metrics?: RealtimeMetric[]
}

const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({ metrics }) => {
  // Default sample metrics for development
  const defaultMetrics: RealtimeMetric[] = [
    {
      id: 'current_load_time',
      name: 'Current Load Time',
      value: 1.42,
      unit: 's',
      status: 'good',
      lastUpdated: Date.now()
    },
    {
      id: 'active_sessions',
      name: 'Active Sessions',
      value: 23,
      unit: '',
      status: 'good',
      lastUpdated: Date.now()
    },
    {
      id: 'response_time',
      name: 'API Response',
      value: 145,
      unit: 'ms',
      status: 'good',
      lastUpdated: Date.now()
    },
    {
      id: 'error_rate_now',
      name: 'Error Rate (5m)',
      value: 0.02,
      unit: '%',
      status: 'good',
      lastUpdated: Date.now()
    }
  ]

  const displayMetrics = metrics || defaultMetrics

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <Activity className="w-3 h-3" />
      case 'warning':
        return <AlertCircle className="w-3 h-3" />
      case 'error':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <Activity className="w-3 h-3" />
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(2)}${unit}`
    } else if (unit === 's') {
      return `${value.toFixed(2)}${unit}`
    } else if (unit === 'ms') {
      return `${Math.round(value)}${unit}`
    } else {
      return `${Math.round(value)}${unit}`
    }
  }

  const isMetricRecent = (lastUpdated: number) => {
    return Date.now() - lastUpdated < 30000 // 30 seconds
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-900">Live Metrics</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Wifi className="w-3 h-3" />
          <span>Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayMetrics.map((metric) => (
          <div key={metric.id} className="relative">
            {/* Metric Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  {metric.name}
                </span>
                
                {/* Status Indicator */}
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(metric.status)}`}>
                  {getStatusIcon(metric.status)}
                </div>
              </div>
              
              {/* Value */}
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-gray-900">
                  {formatValue(metric.value, metric.unit)}
                </span>
                
                {/* Freshness indicator */}
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isMetricRecent(metric.lastUpdated) ? 'bg-green-400' : 'bg-gray-400'
                }`} />
              </div>
              
              {/* Last updated */}
              <div className="text-xs text-gray-500 mt-1">
                {isMetricRecent(metric.lastUpdated) ? 'Live' : `${Math.round((Date.now() - metric.lastUpdated) / 1000)}s ago`}
              </div>
            </div>

            {/* Animation pulse for live updates */}
            {isMetricRecent(metric.lastUpdated) && (
              <div className="absolute inset-0 bg-blue-200 rounded-lg animate-pulse opacity-20 pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Summary Status */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">
              System performance is <span className="font-medium text-green-600">optimal</span>
            </span>
          </div>
          
          <div className="text-gray-500">
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealtimeMetrics