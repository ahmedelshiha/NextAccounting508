/**
 * Admin Performance Dashboard
 * 
 * Provides comprehensive performance and UX baseline monitoring for the admin dashboard.
 * Displays real-time metrics, historical trends, and actionable recommendations.
 * 
 * Features:
 * - Core Web Vitals tracking (LCP, FID, CLS)
 * - Custom admin metrics (load times, user interactions)
 * - UX analytics and user journey insights
 * - Performance alerts and recommendations
 * - Exportable performance reports
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Activity, 
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react'
import { usePerformanceMonitoring } from '@/hooks/admin/usePerformanceMonitoring'

interface MetricCard {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  status: 'excellent' | 'good' | 'warning' | 'poor'
  description: string
}

export default function PerformanceDashboard() {
  const { metrics, alerts, performanceScore, getPerformanceSummary } = usePerformanceMonitoring('PerformanceDashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Export performance report
  const handleExport = () => {
    const summary = getPerformanceSummary()
    const reportData = {
      timestamp: new Date().toISOString(),
      performanceScore,
      metrics,
      alerts,
      recommendations: summary.recommendations,
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Calculate metric cards
  const getMetricCards = (): MetricCard[] => {
    const sessionDuration = Date.now() - metrics.sessionStartTime
    
    return [
      {
        title: 'Performance Score',
        value: `${performanceScore}/100`,
        trend: performanceScore >= 80 ? 'up' : performanceScore >= 60 ? 'neutral' : 'down',
        status: performanceScore >= 80 ? 'excellent' : performanceScore >= 60 ? 'good' : performanceScore >= 40 ? 'warning' : 'poor',
        description: 'Overall performance rating based on Core Web Vitals and custom metrics'
      },
      {
        title: 'Largest Contentful Paint',
        value: metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'Measuring...',
        trend: metrics.lcp && metrics.lcp <= 2500 ? 'up' : 'down',
        status: metrics.lcp ? (metrics.lcp <= 2500 ? 'excellent' : metrics.lcp <= 4000 ? 'warning' : 'poor') : 'good',
        description: 'Time until the largest content element becomes visible'
      },
      {
        title: 'First Input Delay',
        value: metrics.fid ? `${Math.round(metrics.fid)}ms` : 'Awaiting interaction',
        trend: metrics.fid && metrics.fid <= 100 ? 'up' : 'down',
        status: metrics.fid ? (metrics.fid <= 100 ? 'excellent' : metrics.fid <= 300 ? 'warning' : 'poor') : 'good',
        description: 'Delay between first user interaction and browser response'
      },
      {
        title: 'Cumulative Layout Shift',
        value: metrics.cls ? metrics.cls.toFixed(3) : '0.000',
        trend: metrics.cls && metrics.cls <= 0.1 ? 'up' : 'down',
        status: metrics.cls ? (metrics.cls <= 0.1 ? 'excellent' : metrics.cls <= 0.25 ? 'warning' : 'poor') : 'excellent',
        description: 'Visual stability measure of unexpected layout shifts'
      },
      {
        title: 'Dashboard Load Time',
        value: metrics.dashboardLoadTime ? `${Math.round(metrics.dashboardLoadTime)}ms` : 'Loading...',
        trend: metrics.dashboardLoadTime && metrics.dashboardLoadTime <= 3000 ? 'up' : 'down',
        status: metrics.dashboardLoadTime ? (metrics.dashboardLoadTime <= 3000 ? 'excellent' : metrics.dashboardLoadTime <= 5000 ? 'warning' : 'poor') : 'good',
        description: 'Time to fully load the admin dashboard'
      },
      {
        title: 'User Interactions',
        value: metrics.userInteractions.toString(),
        status: 'good' as const,
        description: 'Total user interactions tracked in this session'
      },
      {
        title: 'Session Duration',
        value: `${Math.round(sessionDuration / 1000)}s`,
        status: 'good' as const,
        description: 'Duration of current admin session'
      },
      {
        title: 'Error Count',
        value: metrics.errorCount.toString(),
        trend: metrics.errorCount === 0 ? 'up' : 'down',
        status: metrics.errorCount === 0 ? 'excellent' : metrics.errorCount <= 2 ? 'warning' : 'poor',
        description: 'Number of errors encountered in this session'
      }
    ]
  }

  const metricCards = getMetricCards()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor admin dashboard performance and user experience metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Performance Score</span>
            <Badge variant={performanceScore >= 80 ? 'default' : performanceScore >= 60 ? 'secondary' : 'destructive'}>
              {performanceScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                performanceScore >= 80 ? 'bg-green-500' : 
                performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${performanceScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {performanceScore >= 80 && 'Excellent performance! Your admin dashboard is highly optimized.'}
            {performanceScore >= 60 && performanceScore < 80 && 'Good performance with room for improvement.'}
            {performanceScore < 60 && 'Performance needs attention. Review recommendations below.'}
          </p>
        </CardContent>
      </Card>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  {card.change && (
                    <div className="text-xs text-gray-500 mt-1">{card.change}</div>
                  )}
                </div>
                {card.trend && (
                  <div className={`flex items-center ${
                    card.trend === 'up' ? 'text-green-600' : 
                    card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                     card.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
                     <Activity className="w-4 h-4" />}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{card.description}</p>
              {card.status && (
                <Badge 
                  variant={card.status === 'excellent' ? 'default' : 
                          card.status === 'good' ? 'secondary' : 
                          card.status === 'warning' ? 'secondary' : 'destructive'}
                  className="mt-2 text-xs"
                >
                  {card.status}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${
                        alert.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {alert.metric} threshold exceeded
                      </div>
                      <div className={`text-sm ${
                        alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        Current: {Math.round(alert.value)} | Threshold: {alert.threshold}
                      </div>
                    </div>
                    <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                      {alert.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getPerformanceSummary().recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
            {getPerformanceSummary().recommendations.length === 0 && (
              <div className="text-center py-8">
                <div className="text-green-600 mb-2">
                  <TrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-gray-600">No recommendations at this time. Performance is optimal!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
              {JSON.stringify({ metrics, alerts, performanceScore }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}