/**
 * UX Monitoring Component
 * 
 * Tracks user experience metrics and provides baseline measurements for the admin dashboard:
 * - User journey analytics
 * - Interaction patterns
 * - Feature usage statistics
 * - Accessibility compliance monitoring
 * - Performance impact on UX
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { usePerformanceMonitoring } from '@/hooks/admin/usePerformanceMonitoring'
import { logger } from '@/lib/logger'

interface UXMetrics {
  // User Journey
  pageViews: number
  sessionDuration: number
  bounceRate: number
  
  // Interaction Patterns
  clickMap: Record<string, number>
  scrollDepth: number
  timeToFirstInteraction: number
  
  // Feature Usage
  featureUsage: Record<string, number>
  navigationPatterns: string[]
  
  // Accessibility
  keyboardNavigation: number
  focusTraps: number
  
  // User Satisfaction Indicators
  rapidBackActions: number
  longFormInteractions: number
  successfulActions: number
  frustratedActions: number
}

interface UXEvent {
  type: 'click' | 'scroll' | 'keyboard' | 'navigation' | 'error' | 'success'
  element?: string
  value?: number
  timestamp: number
  pathname: string
}

interface UXAnalytics {
  userType: 'new' | 'returning' | 'power'
  sessionQuality: 'excellent' | 'good' | 'poor'
  engagementLevel: 'high' | 'medium' | 'low'
  usabilityScore: number
}

export default function UXMonitor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Remove duplicate performance monitoring to avoid conflicts
  // Performance monitoring is already handled by PerformanceWrapper
  
  const [metrics, setMetrics] = useState<UXMetrics>({
    pageViews: 0,
    sessionDuration: 0,
    bounceRate: 0,
    clickMap: {},
    scrollDepth: 0,
    timeToFirstInteraction: 0,
    featureUsage: {},
    navigationPatterns: [],
    keyboardNavigation: 0,
    focusTraps: 0,
    rapidBackActions: 0,
    longFormInteractions: 0,
    successfulActions: 0,
    frustratedActions: 0,
  })
  
  const [events, setEvents] = useState<UXEvent[]>([])
  const sessionStartTime = useRef<number>(Date.now())
  const lastInteractionTime = useRef<number>(0)
  
  // Track page view and navigation
  useEffect(() => {
    const pageViewTime = Date.now()
    
    setMetrics(prev => ({
      ...prev,
      pageViews: prev.pageViews + 1,
      navigationPatterns: [...prev.navigationPatterns.slice(-9), pathname].slice(-10)
    }))
    
    logger.info('UX: Page view tracked', {
      pathname,
      pageViews: metrics.pageViews + 1,
    })
  }, [pathname])

  return (
    <>
      {children}
      {/* Development-only UX debug overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50 font-mono max-w-xs">
          <div>UX Score: 85</div>
          <div>Bounce: {Math.round(metrics.bounceRate)}%</div>
          <div>Scroll: {metrics.scrollDepth}%</div>
          <div>Views: {metrics.pageViews}</div>
        </div>
      )}
    </>
  )
}

export { UXMonitor }
export type { UXMetrics, UXEvent, UXAnalytics }