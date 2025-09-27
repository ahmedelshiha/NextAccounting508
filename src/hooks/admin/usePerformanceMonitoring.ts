/**
 * Admin Dashboard Performance Monitoring Hook
 * 
 * Comprehensive performance tracking system for admin dashboard including:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Custom business metrics (load times, user interactions)
 * - UX baseline measurements
 * - Real-time performance alerts
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay  
  cls?: number // Cumulative Layout Shift
  
  // Custom Admin Metrics
  dashboardLoadTime?: number
  apiResponseTime?: number
  renderTime?: number
  hydrationTime?: number
  
  // User Experience
  userInteractions: number
  errorCount: number
  sessionStartTime: number
  
  // Navigation Performance
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
  lcp: 2500, // 2.5s (Good)
  fid: 100,  // 100ms (Good)
  cls: 0.1,  // 0.1 (Good)
  dashboardLoadTime: 3000, // 3s
  apiResponseTime: 1000,   // 1s
  renderTime: 500,         // 500ms
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
  
  // Update metrics ref when state changes
  useEffect(() => {
    metricsRef.current = metrics
  }, [metrics])

  // Initialize performance monitoring
  useEffect(() => {
    const startTime = Date.now()
    componentMountTime.current = startTime
    
    // Measure hydration time
    const hydrationTime = startTime - (window.performance?.timing?.navigationStart || startTime)
    updateMetric('hydrationTime', hydrationTime)
    
    // Set up Core Web Vitals monitoring
    setupWebVitals()
    
    // Set up custom performance observers
    setupCustomObservers()
    
    // Log component mount
    logger.info(`Performance monitoring started for ${componentName}`, {
      component: componentName,
      startTime,
      hydrationTime,
    })
    
    return () => {
      // Calculate session metrics on unmount
      const sessionDuration = Date.now() - startTime
      logger.info(`Performance session ended for ${componentName}`, {
        component: componentName,
        sessionDuration,
        finalMetrics: metricsRef.current,
        alerts: alerts.length,
      })
    }
  }, [componentName])

  // Update a specific metric and check thresholds
  const updateMetric = (key: keyof PerformanceMetrics, value: number) => {
    setMetrics(prev => {
      const updated = { ...prev, [key]: value }
      
      // Check performance thresholds
      checkThreshold(key, value)
      
      return updated
    })
  }

  // Check if metric exceeds threshold and create alert
  const checkThreshold = (metric: string, value: number) => {
    const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS]
    if (threshold && value > threshold) {
      const alert: PerformanceAlert = {
        type: value > threshold * 1.5 ? 'error' : 'warning',
        metric,
        value,
        threshold,
        timestamp: Date.now(),
      }
      
      setAlerts(prev => [...prev.slice(-4), alert]) // Keep last 5 alerts
      
      logger.warn(`Performance threshold exceeded for ${metric}`, {
        metric,
        value,
        threshold,
        severity: alert.type,
      })
    }
  }

  // Setup Core Web Vitals monitoring
  const setupWebVitals = () => {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            updateMetric('lcp', lastEntry.startTime)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        
        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              updateMetric('fid', entry.processingStart - entry.startTime)
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        
        // CLS - Cumulative Layout Shift
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

  // Setup custom performance observers
  const setupCustomObservers = () => {
    if ('PerformanceObserver' in window) {
      try {
        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.entryType === 'navigation') {
              updateMetric('dashboardLoadTime', entry.loadEventEnd - entry.fetchStart)
            }
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        
        // Measure API calls
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.name.includes('/api/')) {
              updateMetric('apiResponseTime', entry.duration)
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        
      } catch (error) {
        logger.warn('Custom PerformanceObserver setup failed', { error })
      }
    }
  }

  // Track user interaction
  const trackInteraction = (action: string, details?: object) => {
    setMetrics(prev => ({
      ...prev,
      userInteractions: prev.userInteractions + 1,
    }))
    
    logger.info('User interaction tracked', {
      action,
      component: componentName,
      details,
      timestamp: Date.now(),
    })
  }

  // Track error occurrence
  const trackError = (error: Error | string, context?: object) => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
    }))
    
    logger.error('Error tracked in performance monitoring', {
      error: typeof error === 'string' ? error : error.message,
      component: componentName,
      context,
      timestamp: Date.now(),
    })
  }

  // Measure render performance
  const measureRender = (renderType: string = 'component') => {
    const renderStart = Date.now()
    
    return () => {
      const renderTime = Date.now() - renderStart
      updateMetric('renderTime', renderTime)
      
      logger.debug('Render performance measured', {
        renderType,
        renderTime,
        component: componentName,
      })
    }
  }

  // Measure route change performance
  const measureRouteChange = () => {
    const routeStart = Date.now()
    
    return () => {
      const routeTime = Date.now() - routeStart
      updateMetric('routeChangeTime', routeTime)
    }
  }

  // Get performance summary
  const getPerformanceSummary = () => {
    const sessionDuration = Date.now() - metrics.sessionStartTime
    
    return {
      ...metrics,
      sessionDuration,
      alertCount: alerts.length,
      performanceScore: calculatePerformanceScore(),
      recommendations: generateRecommendations(),
    }
  }

  // Calculate overall performance score (0-100)
  const calculatePerformanceScore = () => {
    let score = 100
    
    // Deduct points for each threshold violation
    if (metrics.lcp && metrics.lcp > PERFORMANCE_THRESHOLDS.lcp) {
      score -= Math.min(20, (metrics.lcp - PERFORMANCE_THRESHOLDS.lcp) / 100)
    }
    if (metrics.fid && metrics.fid > PERFORMANCE_THRESHOLDS.fid) {
      score -= Math.min(15, (metrics.fid - PERFORMANCE_THRESHOLDS.fid) / 10)
    }
    if (metrics.cls && metrics.cls > PERFORMANCE_THRESHOLDS.cls) {
      score -= Math.min(15, (metrics.cls - PERFORMANCE_THRESHOLDS.cls) * 100)
    }
    if (metrics.dashboardLoadTime && metrics.dashboardLoadTime > PERFORMANCE_THRESHOLDS.dashboardLoadTime) {
      score -= Math.min(20, (metrics.dashboardLoadTime - PERFORMANCE_THRESHOLDS.dashboardLoadTime) / 100)
    }
    
    // Factor in error rate
    const errorRate = metrics.errorCount / Math.max(1, metrics.userInteractions)
    score -= Math.min(30, errorRate * 100)
    
    return Math.max(0, Math.round(score))
  }

  // Generate performance recommendations
  const generateRecommendations = () => {
    const recommendations: string[] = []
    
    if (metrics.lcp && metrics.lcp > PERFORMANCE_THRESHOLDS.lcp) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS')
    }
    if (metrics.fid && metrics.fid > PERFORMANCE_THRESHOLDS.fid) {
      recommendations.push('Reduce First Input Delay - minimize JavaScript execution time')
    }
    if (metrics.cls && metrics.cls > PERFORMANCE_THRESHOLDS.cls) {
      recommendations.push('Improve Cumulative Layout Shift - reserve space for dynamic content')
    }
    if (metrics.dashboardLoadTime && metrics.dashboardLoadTime > PERFORMANCE_THRESHOLDS.dashboardLoadTime) {
      recommendations.push('Optimize dashboard load time - implement code splitting and lazy loading')
    }
    if (metrics.apiResponseTime && metrics.apiResponseTime > PERFORMANCE_THRESHOLDS.apiResponseTime) {
      recommendations.push('Optimize API response time - implement caching and optimize queries')
    }
    
    return recommendations
  }

  return {
    metrics,
    alerts,
    updateMetric,
    trackInteraction,
    trackError,
    measureRender,
    measureRouteChange,
    getPerformanceSummary,
    performanceScore: calculatePerformanceScore(),
  }
}

export type { PerformanceMetrics, PerformanceAlert }