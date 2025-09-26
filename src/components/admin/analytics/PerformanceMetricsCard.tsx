/**
 * Performance Metrics Card Component
 * Displays individual performance metrics with trends and comparisons
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PerformanceMetricsCardProps {
  title: string
  value: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow'
  subtitle?: string
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  title,
  value,
  change,
  trend = 'stable',
  icon,
  color = 'blue',
  subtitle
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-200',
        accent: 'text-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-200',
        accent: 'text-green-700'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        border: 'border-red-200',
        accent: 'text-red-700'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200',
        accent: 'text-purple-700'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        border: 'border-yellow-200',
        accent: 'text-yellow-700'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const getTrendColor = (trend: string, change?: number) => {
    if (!change) return 'text-gray-500'
    
    // For certain metrics, down trend is good (like error rates, load times)
    const isInverseMetric = title.toLowerCase().includes('error') || 
                           title.toLowerCase().includes('load time') ||
                           title.toLowerCase().includes('response time')
    
    if (trend === 'down') {
      return isInverseMetric ? 'text-green-600' : 'text-red-600'
    } else if (trend === 'up') {
      return isInverseMetric ? 'text-red-600' : 'text-green-600'
    }
    return 'text-gray-500'
  }

  const getTrendIcon = () => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4" />
    } else if (trend === 'down') {
      return <TrendingDown className="w-4 h-4" />
    }
    return null
  }

  const colorClasses = getColorClasses(color)

  return (
    <div className={`bg-white rounded-lg border ${colorClasses.border} p-6 transition-all duration-200 hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
          <div className={colorClasses.icon}>
            {icon}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend, change)}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">
          {title}
        </p>
        <p className={`text-2xl font-bold ${colorClasses.accent}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Progress indicator for certain metrics */}
      {(title.toLowerCase().includes('uptime') || title.toLowerCase().includes('health')) && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${colorClasses.icon.replace('text-', 'bg-')} h-2 rounded-full`}
              style={{ width: `${Math.min(100, parseFloat(value.replace('%', '')))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMetricsCard