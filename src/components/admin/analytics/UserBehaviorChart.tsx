/**
 * User Behavior Chart Component
 * Displays user interaction patterns and behavior analytics
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

'use client'

import React from 'react'
import { BarChart3, Users, MousePointer, Clock } from 'lucide-react'

interface UserBehaviorData {
  totalSessions: number
  averageSessionDuration: number
  bounceRate: number
  mostUsedFeatures: Array<{ name: string; count: number }>
}

interface UserBehaviorChartProps {
  data: UserBehaviorData
  timeRange: '1h' | '24h' | '7d' | '30d'
}

const UserBehaviorChart: React.FC<UserBehaviorChartProps> = ({ data, timeRange }) => {
  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1h': return 'Last Hour'
      case '24h': return 'Last 24 Hours'
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      default: return 'Last 24 Hours'
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-blue-700">
            {data.totalSessions}
          </div>
          <div className="text-xs text-blue-600">Sessions</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-semibold text-green-700">
            {data.averageSessionDuration.toFixed(1)}m
          </div>
          <div className="text-xs text-green-600">Avg Duration</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <MousePointer className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-semibold text-purple-700">
            {(data.bounceRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-purple-600">Bounce Rate</div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">User Behavior Chart</p>
          <p className="text-xs text-gray-500">{getTimeRangeLabel(timeRange)}</p>
          <p className="text-xs text-gray-400 mt-1">Chart.js integration coming soon</p>
        </div>
      </div>
    </div>
  )
}

export default UserBehaviorChart