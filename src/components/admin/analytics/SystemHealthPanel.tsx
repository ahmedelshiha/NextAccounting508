/**
 * System Health Panel Component
 * Displays system health metrics and status indicators
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

'use client'

import React from 'react'
import { 
  Shield, 
  Server, 
  Database, 
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity
} from 'lucide-react'

interface SystemHealthData {
  uptime: number
  memoryUsage: number
  responseTime: number
  status: 'healthy' | 'warning' | 'error'
}

interface SystemHealthPanelProps {
  healthData: SystemHealthData
  historicalData?: any // Will be implemented with charts
}

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ healthData }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getMemoryUsageColor = (usage: number) => {
    if (usage < 70) return 'bg-green-500'
    if (usage < 85) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getResponseTimeStatus = (time: number) => {
    if (time < 200) return 'Excellent'
    if (time < 500) return 'Good'
    if (time < 1000) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(healthData.status)}`}>
          {getStatusIcon(healthData.status)}
          <span className="text-sm font-medium capitalize">{healthData.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Uptime */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">System Uptime</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-700">
                {healthData.uptime.toFixed(2)}%
              </span>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${healthData.uptime}%` }}
              />
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-700">
                {healthData.memoryUsage.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">
                {healthData.memoryUsage < 70 ? 'Normal' : healthData.memoryUsage < 85 ? 'High' : 'Critical'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getMemoryUsageColor(healthData.memoryUsage)}`}
                style={{ width: `${healthData.memoryUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* API Response Time */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">API Response</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-700">
                {healthData.responseTime}ms
              </span>
              <span className="text-sm text-gray-500">
                {getResponseTimeStatus(healthData.responseTime)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Service Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Database', status: 'healthy' },
            { name: 'API Server', status: 'healthy' },
            { name: 'File Storage', status: 'healthy' },
            { name: 'Email Service', status: 'warning' },
          ].map((service) => (
            <div key={service.name} className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                service.status === 'healthy' 
                  ? 'bg-green-500' 
                  : service.status === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-700">{service.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Data Placeholder */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">Health Trends</h4>
          <span className="text-xs text-gray-500">Last 24 hours</span>
        </div>
        <div className="h-20 flex items-center justify-center border border-dashed border-gray-200 rounded-lg">
          <span className="text-sm text-gray-500">Health trend chart coming soon</span>
        </div>
      </div>
    </div>
  )
}

export default SystemHealthPanel