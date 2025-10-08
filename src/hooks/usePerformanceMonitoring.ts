'use client'

import { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'

interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  dashboardLoadTime?: number
  apiResponseTime?: number
  renderTime?: number
  hydrationTime?: number
  userInteractions: number
  errorCount: number
  sessionStartTime: number
  routeChangeTime?: number
  sidebarToggleTime?: number
}

interface PerformanceAlert {
  type: 'warning' | 'error'
  metric: string
  value: number
  threshold: number
  timestamp: number
}

const PERFORMANCE_THRESHOLDS = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  dashboardLoadTime: 3000,
  apiResponseTime: 1000,
  renderTime: 500,
}

export function usePerformanceMonitoring(componentName: string = 'AdminDashboard') {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    userInteractions: 0,
    errorCount: 0,
    sessionStartTime: Date.now(),
  })

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const metricsRef = useRef<PerformanceMetrics>(metrics)
  const componentMountTime = useRef<number>(Date.now())

  useEffect(() => {
    metricsRef.current = metrics
  }, [metrics])

  useEffect(() => {
    const startTime = Date.now()
    componentMountTime.current = startTime

    const hydrationTime = startTime - (window.performance?.timing?.navigationStart || startTime)
    updateMetric('hydrationTime', hydrationTime)

    setupWebVitals()
    setupCustomObservers()

    logger.info(`Performance monitoring started for ${componentName}`, {
      component: componentName,
      startTime,
      hydrationTime,
    })

    return () => {
      const sessionDuration = Date.now() - startTime
      logger.info(`Performance session ended for ${componentName}`, {
        component: componentName,
        sessionDuration,
        finalMetrics: metricsRef.current,
        alerts: alerts.length,
      })
    }
  }, [componentName])

  const updateMetric = (key: keyof PerformanceMetrics, value: number) => {
    setMetrics(prev => {
      const updated = { ...prev, [key]: value }
      checkThreshold(key as string, value)
      return updated
    })
  }

  const checkThreshold = (metric: string, value: number) => {
    const threshold = (PERFORMANCE_THRESHOLDS as any)[metric]
    if (threshold && value > threshold) {
      const alert: PerformanceAlert = {
        type: value > threshold * 1.5 ? 'error' : 'warning',
        metric,
        value,
        threshold,
        timestamp: Date.now(),
      }

      setAlerts(prev => [...prev.slice(-4), alert])

      logger.warn(`Performance threshold exceeded for ${metric}`, {
        metric,
        value,
        threshold,
        severity: alert.type,
      })
    }
  }

  const setupWebVitals = () => {
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) updateMetric('lcp', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) updateMetric('fid', entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              updateMetric('cls', clsValue)
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

      } catch (error) {
        logger.warn('PerformanceObserver not fully supported', { error })
      }
    }
  }

  const setupCustomObservers = () => {
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.entryType === 'navigation') updateMetric('dashboardLoadTime', entry.loadEventEnd - entry.fetchStart)
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })

        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.name.includes('/api/')) updateMetric('apiResponseTime', entry.duration)
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })

      } catch (error) {
        logger.warn('Custom PerformanceObserver setup failed', { error })
      }
    }
  }

  const trackInteraction = (action: string, details?: object) => {
    setMetrics(prev => ({ ...prev, userInteractions: prev.userInteractions + 1 }))
    logger.info('User interaction tracked', { action, component: componentName, details, timestamp: Date.now() })
  }

  const trackError = (error: Error | string, context?: object) => {
    setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
    logger.error('Error tracked in performance monitoring', { error: typeof error === 'string' ? error : error.message, component: componentName, context, timestamp: Date.now() })
  }

  const measureRender = (renderType: string = 'component') => {
    const renderStart = Date.now()
    return () => {
      const renderTime = Date.now() - renderStart
      updateMetric('renderTime', renderTime)
      logger.debug('Render performance measured', { renderType, renderTime, component: componentName })
    }
  }

  const measureRouteChange = () => {
    const routeStart = Date.now()
    return () => { const routeTime = Date.now() - routeStart; updateMetric('routeChangeTime', routeTime) }
  }

  const getPerformanceSummary = () => {
    const sessionDuration = Date.now() - metrics.sessionStartTime
    return { ...metrics, sessionDuration, alertCount: alerts.length, performanceScore: calculatePerformanceScore(), recommendations: generateRecommendations() }
  }

  const calculatePerformanceScore = () => {
    let score = 100
    if (metrics.lcp && metrics.lcp > (PERFORMANCE_THRESHOLDS as any).lcp) score -= Math.min(20, (metrics.lcp - (PERFORMANCE_THRESHOLDS as any).lcp) / 100)
    if (metrics.fid && metrics.fid > (PERFORMANCE_THRESHOLDS as any).fid) score -= Math.min(15, (metrics.fid - (PERFORMANCE_THRESHOLDS as any).fid) / 10)
    if (metrics.cls && metrics.cls > (PERFORMANCE_THRESHOLDS as any).cls) score -= Math.min(15, (metrics.cls - (PERFORMANCE_THRESHOLDS as any).cls) * 100)
    if (metrics.dashboardLoadTime && metrics.dashboardLoadTime > (PERFORMANCE_THRESHOLDS as any).dashboardLoadTime) score -= Math.min(20, (metrics.dashboardLoadTime - (PERFORMANCE_THRESHOLDS as any).dashboardLoadTime) / 100)
    const errorRate = metrics.errorCount / Math.max(1, metrics.userInteractions)
    score -= Math.min(30, errorRate * 100)
    return Math.max(0, Math.round(score))
  }

  const generateRecommendations = () => {
    const recommendations: string[] = []
    if (metrics.lcp && metrics.lcp > (PERFORMANCE_THRESHOLDS as any).lcp) recommendations.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS')
    if (metrics.fid && metrics.fid > (PERFORMANCE_THRESHOLDS as any).fid) recommendations.push('Reduce First Input Delay - minimize JavaScript execution time')
    if (metrics.cls && metrics.cls > (PERFORMANCE_THRESHOLDS as any).cls) recommendations.push('Improve Cumulative Layout Shift - reserve space for dynamic content')
    if (metrics.dashboardLoadTime && metrics.dashboardLoadTime > (PERFORMANCE_THRESHOLDS as any).dashboardLoadTime) recommendations.push('Optimize dashboard load time - implement code splitting and lazy loading')
    if (metrics.apiResponseTime && metrics.apiResponseTime > (PERFORMANCE_THRESHOLDS as any).apiResponseTime) recommendations.push('Optimize API response time - implement caching and optimize queries')
    return recommendations
  }

  return { metrics, alerts, updateMetric, trackInteraction, trackError, measureRender, measureRouteChange, getPerformanceSummary, performanceScore: calculatePerformanceScore() }
}

export type { PerformanceMetrics, PerformanceAlert }
