/**
 * Performance Analytics Hook
 * Manages real-time performance data and analytics subscriptions
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface RealtimeMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'error'
  lastUpdated: number
}

interface HistoricalDataPoint {
  timestamp: number
  value: number
  metric: string
}

interface PerformanceAnalyticsState {
  realtimeMetrics: RealtimeMetric[]
  historicalData: HistoricalDataPoint[]
  isConnected: boolean
  lastUpdate: number
}

// Generate sample real-time metrics for development (moved outside component)
const generateSampleMetrics = (): RealtimeMetric[] => {
  const baseMetrics = [
    {
      id: 'load_time',
      name: 'Load Time',
      baseValue: 1.8,
      unit: 's',
      variance: 0.5
    },
    {
      id: 'active_users',
      name: 'Active Users',
      baseValue: 25,
      unit: '',
      variance: 8
    },
    {
      id: 'response_time',
      name: 'Response Time',
      baseValue: 150,
      unit: 'ms',
      variance: 50
    },
    {
      id: 'error_rate',
      name: 'Error Rate',
      baseValue: 0.5,
      unit: '%',
      variance: 0.3
    }
  ]

  return baseMetrics.map(metric => {
    const variance = (Math.random() - 0.5) * metric.variance
    const value = Math.max(0, metric.baseValue + variance)
    
    let status: 'good' | 'warning' | 'error' = 'good'
    if (metric.id === 'load_time' && value > 3) status = 'warning'
    if (metric.id === 'load_time' && value > 5) status = 'error'
    if (metric.id === 'response_time' && value > 300) status = 'warning'
    if (metric.id === 'response_time' && value > 1000) status = 'error'
    if (metric.id === 'error_rate' && value > 1) status = 'warning'
    if (metric.id === 'error_rate' && value > 2) status = 'error'

    return {
      id: metric.id,
      name: metric.name,
      value,
      unit: metric.unit,
      status,
      lastUpdated: Date.now()
    }
  })
}

// Generate sample historical data (moved outside component)
const generateHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = []
  const now = Date.now()
  const hoursBack = 24

  for (let i = hoursBack; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000)
    
    // Generate sample data points for different metrics
    const metrics = ['load_time', 'response_time', 'active_users', 'error_rate']
    
    metrics.forEach((metric: string) => {
      let value: number
      
      switch (metric) {
        case 'load_time':
          value = 1.5 + Math.random() * 1.0 // 1.5-2.5s
          break
        case 'response_time':
          value = 120 + Math.random() * 80 // 120-200ms
          break
        case 'active_users':
          value = Math.floor(15 + Math.random() * 20) // 15-35 users
          break
        case 'error_rate':
          value = Math.random() * 0.5 // 0-0.5%
          break
        default:
          value = 0
      }

      data.push({
        timestamp,
        value,
        metric
      })
    })
  }

  return data
}

export const usePerformanceAnalytics = () => {
  const [state, setState] = useState<PerformanceAnalyticsState>({
    realtimeMetrics: [],
    historicalData: [],
    isConnected: false,
    lastUpdate: Date.now()
  })

  const subscriptions = useRef<Set<string>>(new Set())
  const updateInterval = useRef<NodeJS.Timeout | undefined>(undefined)

  // Subscribe to specific metric types
  const subscribe = useCallback((metricType: string) => {
    subscriptions.current.add(metricType)
    
    // If this is the first subscription, start the update cycle
    if (subscriptions.current.size === 1) {
      setState(prevState => ({
        ...prevState,
        isConnected: true,
        realtimeMetrics: generateSampleMetrics(),
        historicalData: generateHistoricalData()
      }))

      // Start periodic updates
      updateInterval.current = setInterval(() => {
        setState(prevState => ({
          ...prevState,
          realtimeMetrics: generateSampleMetrics(),
          lastUpdate: Date.now()
        }))
      }, 5000) // Update every 5 seconds
    }
  }, [])

  // Unsubscribe from metric types
  const unsubscribe = useCallback((metricType: string) => {
    subscriptions.current.delete(metricType)
    
    // If no more subscriptions, stop updates
    if (subscriptions.current.size === 0) {
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
        updateInterval.current = undefined
      }
      
      setState(prevState => ({
        ...prevState,
        isConnected: false
      }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
      }
      subscriptions.current.clear()
    }
  }, [])

  // Get historical data for a specific metric
  const getHistoricalData = useCallback((metric: string, timeRange?: '1h' | '24h' | '7d' | '30d') => {
    const now = Date.now()
    let cutoff: number

    switch (timeRange) {
      case '1h':
        cutoff = now - (60 * 60 * 1000)
        break
      case '24h':
        cutoff = now - (24 * 60 * 60 * 1000)
        break
      case '7d':
        cutoff = now - (7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoff = now - (30 * 24 * 60 * 60 * 1000)
        break
      default:
        cutoff = now - (24 * 60 * 60 * 1000) // Default to 24h
    }

    return state.historicalData
      .filter(point => point.metric === metric && point.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [state.historicalData])

  // Get current metric value
  const getCurrentMetric = useCallback((metricId: string) => {
    return state.realtimeMetrics.find(metric => metric.id === metricId)
  }, [state.realtimeMetrics])

  // Calculate metric statistics
  const getMetricStats = useCallback((metric: string, timeRange?: '1h' | '24h' | '7d' | '30d') => {
    const data = getHistoricalData(metric, timeRange)
    
    if (data.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        trend: 'stable' as const
      }
    }

    const values = data.map(point => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    // Calculate trend (simple comparison of first half vs second half)
    const halfPoint = Math.floor(values.length / 2)
    const firstHalfAvg = values.slice(0, halfPoint).reduce((sum, val) => sum + val, 0) / halfPoint
    const secondHalfAvg = values.slice(halfPoint).reduce((sum, val) => sum + val, 0) / (values.length - halfPoint)
    
    let trend: 'up' | 'down' | 'stable' = 'stable'
    const changePercent = Math.abs((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    
    if (changePercent > 5) {
      trend = secondHalfAvg > firstHalfAvg ? 'up' : 'down'
    }

    return {
      min,
      max,
      avg,
      trend
    }
  }, [getHistoricalData])

  return {
    realtimeMetrics: state.realtimeMetrics,
    historicalData: state.historicalData,
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,
    subscribe,
    unsubscribe,
    getHistoricalData,
    getCurrentMetric,
    getMetricStats
  }
}