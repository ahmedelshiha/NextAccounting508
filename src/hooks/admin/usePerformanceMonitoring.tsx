/**
 * Admin Dashboard Performance Monitoring Hook
 * Tracks performance metrics, component render times, and user interactions
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  pathname: string
  metadata?: Record<string, any>
}

interface NavigationTiming {
  route: string
  startTime: number
  endTime: number
  duration: number
  isInitialLoad: boolean
}

// PerformanceEventTiming interface for FID tracking
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
  processingEnd: number
  cancelable: boolean
}

/**
 * Performance monitoring hook for admin dashboard
 * Tracks component render times, navigation performance, and user interactions
 */
export const usePerformanceMonitoring = (componentName?: string) => {
  const pathname = usePathname()
  const navigationStartTime = useRef<number>(0)
  const renderStartTime = useRef<number>(0)
  const isInitialLoad = useRef<boolean>(true)

  /**
   * Send performance metric to analytics
   * In production, this would integrate with your analytics service
   */
  const sendMetric = useCallback((metric: PerformanceMetric) => {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Admin Performance Metric: ${metric.name}`)
      console.log('Value:', `${metric.value.toFixed(2)}ms`)
      console.log('Route:', metric.pathname)
      console.log('Timestamp:', new Date(metric.timestamp).toISOString())
      if (metric.metadata) {
        console.log('Metadata:', metric.metadata)
      }
      console.groupEnd()
    }

    // Production: Send to analytics service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Example: Google Analytics, DataDog, New Relic, etc.
      try {
        // Google Analytics tracking if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
          const gtag = (window as any).gtag
          gtag('event', 'admin_performance', {
            event_category: 'performance',
            event_label: metric.name,
            value: Math.round(metric.value),
            custom_map: {
              pathname: metric.pathname,
              component: componentName,
            }
          })
        }

        // Custom performance endpoint (optional - only if endpoint exists)
        if (process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT === 'true') {
          fetch('/api/admin/perf-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metric),
          }).catch(err => console.debug('Performance endpoint not available:', err))
        }
      } catch (error) {
        console.warn('Performance tracking error:', error)
      }
    }
  }, [pathname, componentName])

  /**
   * Track page navigation performance
   */
  const trackNavigation = useCallback((route: string) => {
    if (navigationStartTime.current > 0) {
      const endTime = performance.now()
      const duration = endTime - navigationStartTime.current

      const navigationTiming: NavigationTiming = {
        route,
        startTime: navigationStartTime.current,
        endTime,
        duration,
        isInitialLoad: isInitialLoad.current,
      }

      sendMetric({
        name: isInitialLoad.current ? 'admin_initial_load' : 'admin_navigation',
        value: duration,
        timestamp: Date.now(),
        pathname: route,
        metadata: {
          isInitialLoad: isInitialLoad.current,
          previousRoute: pathname,
        }
      })

      isInitialLoad.current = false
    }

    navigationStartTime.current = performance.now()
  }, [pathname, sendMetric])

  /**
   * Track component render performance
   */
  const trackRender = useCallback((renderType: 'mount' | 'update' | 'unmount') => {
    if (!componentName) return

    const now = performance.now()

    if (renderType === 'mount') {
      renderStartTime.current = now
    } else if (renderType === 'update' && renderStartTime.current > 0) {
      const renderDuration = now - renderStartTime.current

      sendMetric({
        name: 'admin_component_render',
        value: renderDuration,
        timestamp: Date.now(),
        pathname,
        metadata: {
          component: componentName,
          renderType,
        }
      })
    }
  }, [componentName, pathname, sendMetric])

  /**
   * Track user interactions
   */
  const trackInteraction = useCallback((
    interactionType: 'click' | 'scroll' | 'input' | 'navigation' | 'search',
    element?: string,
    metadata?: Record<string, any>
  ) => {
    sendMetric({
      name: 'admin_user_interaction',
      value: performance.now(), // Use current time as value
      timestamp: Date.now(),
      pathname,
      metadata: {
        type: interactionType,
        element,
        component: componentName,
        ...metadata,
      }
    })
  }, [pathname, componentName, sendMetric])

  /**
   * Measure and track a function's execution time
   */
  const measureFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    functionName: string
  ) => {
    return (...args: T): R => {
      const startTime = performance.now()
      const result = fn(...args)
      const endTime = performance.now()

      sendMetric({
        name: 'admin_function_execution',
        value: endTime - startTime,
        timestamp: Date.now(),
        pathname,
        metadata: {
          function: functionName,
          component: componentName,
        }
      })

      return result
    }
  }, [pathname, componentName, sendMetric])

  /**
   * Track Web Vitals for admin pages
   */
  const trackWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return

    // Track Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          sendMetric({
            name: 'admin_lcp',
            value: entry.startTime,
            timestamp: Date.now(),
            pathname,
            metadata: {
              element: (entry as any).element?.tagName,
            }
          })
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      console.warn('LCP tracking not supported:', error)
    }

    // Track First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        // Cast to PerformanceEventTiming for processingStart property
        const eventTiming = entry as PerformanceEventTiming
        sendMetric({
          name: 'admin_fid',
          value: eventTiming.processingStart - eventTiming.startTime,
          timestamp: Date.now(),
          pathname,
          metadata: {
            eventType: eventTiming.name,
          }
        })
      }
    })

    try {
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.warn('FID tracking not supported:', error)
    }

    // Cleanup observers
    return () => {
      observer.disconnect()
      fidObserver.disconnect()
    }
  }, [pathname, sendMetric])

  // Track navigation changes
  useEffect(() => {
    trackNavigation(pathname)
  }, [pathname, trackNavigation])

  // Track component lifecycle
  useEffect(() => {
    trackRender('mount')

    return () => {
      trackRender('unmount')
    }
  }, [trackRender])

  // Track Web Vitals
  useEffect(() => {
    const cleanup = trackWebVitals()
    return cleanup
  }, [trackWebVitals])

  return {
    trackNavigation,
    trackRender,
    trackInteraction,
    measureFunction,
    sendMetric,
  }
}

/**
 * HOC for wrapping components with performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent = (props: P) => {
    const { trackRender, trackInteraction } = usePerformanceMonitoring(componentName)

    useEffect(() => {
      trackRender('mount')
    }, [trackRender])

    return (
      <div 
        onClickCapture={() => trackInteraction('click')}
        onScrollCapture={() => trackInteraction('scroll')}
      >
        <Component {...props} />
      </div>
    )
  }

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return WrappedComponent
}

/**
 * Performance monitoring utilities
 */
export const PerformanceUtils = {
  /**
   * Mark the start of a performance measurement
   */
  startMeasurement: (name: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`)
    }
  },

  /**
   * Mark the end of a performance measurement and calculate duration
   */
  endMeasurement: (name: string): number | null => {
    if (typeof performance === 'undefined' || !performance.mark || !performance.measure) {
      return null
    }

    try {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name, 'measure')[0]
      return measure ? measure.duration : null
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error)
      return null
    }
  },

  /**
   * Clear performance measurements
   */
  clearMeasurements: (name: string): void => {
    if (typeof performance !== 'undefined') {
      try {
        performance.clearMarks(`${name}-start`)
        performance.clearMarks(`${name}-end`)
        performance.clearMeasures(name)
      } catch (error) {
        console.warn(`Failed to clear measurements for ${name}:`, error)
      }
    }
  }
}

export default usePerformanceMonitoring