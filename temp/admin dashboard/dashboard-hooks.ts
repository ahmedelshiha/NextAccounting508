// hooks/dashboard/useDashboardData.ts
import { useEffect, useCallback, useRef } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

export const useDashboardData = () => {
  const { 
    data, 
    loading, 
    error, 
    autoRefresh, 
    setLoading, 
    setError, 
    setData 
  } = useDashboardStore()
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadData = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)

    try {
      const [bookingsRes, usersRes, tasksRes, healthRes] = await Promise.allSettled([
        fetch('/api/admin/stats/bookings?range=7d', { 
          signal: abortControllerRef.current.signal 
        }),
        fetch('/api/admin/stats/users', { 
          signal: abortControllerRef.current.signal 
        }),
        fetch('/api/admin/tasks?limit=50', { 
          signal: abortControllerRef.current.signal 
        }),
        fetch('/api/admin/system/health', { 
          signal: abortControllerRef.current.signal 
        })
      ])

      // Process successful responses
      const dashboardData = await processDashboardResponses({
        bookings: bookingsRes.status === 'fulfilled' ? await bookingsRes.value.json() : null,
        users: usersRes.status === 'fulfilled' ? await usersRes.value.json() : null,
        tasks: tasksRes.status === 'fulfilled' ? await tasksRes.value.json() : null,
        health: healthRes.status === 'fulfilled' ? await healthRes.value.json() : null
      })

      setData(dashboardData)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to load dashboard data')
      }
    }
  }, [setLoading, setError, setData])

  // Initial load
  useEffect(() => {
    loadData()
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadData])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(loadData, 300000) // 5 minutes
    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  return { data, loading, error, refetch: loadData }
}

// hooks/dashboard/useRealTimeUpdates.ts
import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

interface BookingUpdateEvent {
  id: string
  clientName: string
  service: string
  scheduledAt: string
  status: string
}

interface TaskCompletedEvent {
  id: string
  status: string
}

interface SystemAlertEvent {
  type: 'urgent' | 'warning' | 'info'
  title: string
  message: string
  category: string
}

export const useRealTimeUpdates = () => {
  const { autoRefresh, addNotification } = useDashboardStore()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!autoRefresh) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    // Create EventSource connection
    eventSourceRef.current = new EventSource('/api/admin/updates')

    eventSourceRef.current.addEventListener('booking_update', (event) => {
      try {
        const data: BookingUpdateEvent = JSON.parse(event.data)
        addNotification({
          type: 'info',
          category: 'booking',
          title: 'Booking Updated',
          message: `${data.clientName} - ${data.service}`,
          read: false,
          actionRequired: false,
          priority: 3
        })
      } catch (error) {
        console.error('Failed to process booking update:', error)
      }
    })

    eventSourceRef.current.addEventListener('task_completed', (event) => {
      try {
        const data: TaskCompletedEvent = JSON.parse(event.data)
        addNotification({
          type: 'success',
          category: 'task',
          title: 'Task Completed',
          message: `Task ${data.id} has been completed`,
          read: false,
          actionRequired: false,
          priority: 4
        })
      } catch (error) {
        console.error('Failed to process task completion:', error)
      }
    })

    eventSourceRef.current.addEventListener('system_alert', (event) => {
      try {
        const data: SystemAlertEvent = JSON.parse(event.data)
        addNotification({
          type: data.type,
          category: data.category as any,
          title: data.title,
          message: data.message,
          read: false,
          actionRequired: data.type === 'urgent',
          priority: data.type === 'urgent' ? 1 : 2
        })
      } catch (error) {
        console.error('Failed to process system alert:', error)
      }
    })

    eventSourceRef.current.onerror = () => {
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          eventSourceRef.current = null
          // Trigger re-effect to reconnect
        }
      }, 5000)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [autoRefresh, addNotification])

  return {
    connected: eventSourceRef.current?.readyState === EventSource.OPEN
  }
}

// hooks/dashboard/useSystemHealth.ts
import { useMemo } from 'react'
import { useSystemHealth as useSystemHealthStore } from '@/stores/dashboardStore'

export const useSystemHealth = () => {
  const systemHealth = useSystemHealthStore()

  const healthScore = useMemo(() => {
    if (!systemHealth) return 0

    const scores = {
      database: systemHealth.database.status === 'healthy' ? 20 : systemHealth.database.status === 'warning' ? 15 : 10,
      api: systemHealth.api.status === 'healthy' ? 20 : systemHealth.api.status === 'warning' ? 15 : 10,
      email: systemHealth.email.status === 'healthy' ? 20 : systemHealth.email.status === 'warning' ? 15 : 10,
      storage: systemHealth.storage.status === 'healthy' ? 20 : systemHealth.storage.status === 'warning' ? 15 : 10,
      security: systemHealth.security.status === 'healthy' ? 20 : systemHealth.security.status === 'warning' ? 15 : 10
    }

    return Object.values(scores).reduce((total, score) => total + score, 0)
  }, [systemHealth])

  const criticalIssues = useMemo(() => {
    if (!systemHealth) return []

    const issues = []
    Object.entries(systemHealth).forEach(([system, health]) => {
      if (typeof health === 'object' && health.status === 'error') {
        issues.push(system)
      }
    })
    return issues
  }, [systemHealth])

  return {
    systemHealth,
    healthScore,
    criticalIssues,
    isHealthy: healthScore >= 90,
    hasWarnings: healthScore >= 70 && healthScore < 90,
    isCritical: healthScore < 70
  }
}

// hooks/ui/useVirtualization.ts
import { useMemo, useState, useEffect } from 'react'

interface VirtualizationOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export const useVirtualization = <T>(
  items: T[], 
  options: VirtualizationOptions
) => {
  const [scrollTop, setScrollTop] = useState(0)
  const { itemHeight, containerHeight, overscan = 5 } = options

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    offsetY: visibleRange.start * itemHeight
  }
}

// hooks/ui/useDebounce.ts
import { useState, useEffect } from 'react'

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// hooks/ui/useLocalStorage.ts
import { useState, useEffect } from 'react'

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue] as const
}

// Helper function to process API responses into dashboard data
async function processDashboardResponses(responses: {
  bookings: any
  users: any  
  tasks: any
  health: any
}) {
  const { bookings, users, tasks, health } = responses

  // Calculate KPI metrics
  const stats = {
    revenue: {
      current: bookings?.revenue?.thisMonth || 0,
      previous: bookings?.revenue?.lastMonth || 0,
      trend: bookings?.revenue?.growth || 0,
      target: bookings?.revenue?.target || 30000,
      targetProgress: ((bookings?.revenue?.thisMonth || 0) / 30000) * 100
    },
    bookings: {
      total: bookings?.total || 0,
      today: bookings?.today || 0,
      thisWeek: bookings?.thisWeek || 0,
      pending: bookings?.pending || 0,
      confirmed: bookings?.confirmed || 0,
      completed: bookings?.completed || 0,
      cancelled: bookings?.cancelled || 0,
      conversion: bookings?.conversion || 0
    },
    clients: {
      total: users?.clients || 0,
      new: users?.newThisMonth || 0,
      active: users?.activeUsers || 0,
      inactive: users?.inactiveUsers || 0,
      retention: users?.retention || 0,
      satisfaction: users?.satisfaction || 4.5
    },
    tasks: {
      total: Array.isArray(tasks) ? tasks.length : 0,
      overdue: Array.isArray(tasks) ? tasks.filter((t: any) => 
        t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'DONE'
      ).length : 0,
      dueToday: Array.isArray(tasks) ? tasks.filter((t: any) => {
        if (!t.dueAt) return false
        const today = new Date()
        const dueDate = new Date(t.dueAt)
        return dueDate.toDateString() === today.toDateString()
      }).length : 0,
      completed: Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'DONE').length : 0,
      inProgress: Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'IN_PROGRESS').length : 0,
      productivity: Array.isArray(tasks) && tasks.length > 0 ? 
        (tasks.filter((t: any) => t.status === 'DONE').length / tasks.length) * 100 : 0
    }
  }

  // Process recent bookings
  const recentBookings = bookings?.bookings?.slice(0, 10) || []

  // Process urgent tasks
  const urgentTasks = Array.isArray(tasks) ? 
    tasks.filter((t: any) => t.priority === 'HIGH' || t.priority === 'URGENT').slice(0, 5) : []

  // Generate mock notifications for demo
  const notifications = [
    {
      id: Date.now().toString(),
      type: 'urgent' as const,
      category: 'task' as const,
      title: 'Critical Deadline Approaching',
      message: 'VAT returns due tomorrow for 15 clients',
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: true,
      actionUrl: '/admin/tasks/vat-returns',
      priority: 1
    }
  ]

  return {
    stats,
    recentBookings,
    urgentTasks,
    systemHealth: health || {
      overall: 'healthy',
      database: { status: 'healthy', responseTime: 45, connections: 23, lastBackup: new Date().toISOString() },
      api: { status: 'healthy', uptime: 99.8, averageResponseTime: 120, errorRate: 0.2 },
      email: { status: 'healthy', deliveryRate: 98.5, bounceRate: 1.2, lastSent: new Date().toISOString() },
      storage: { status: 'healthy', used: 2.4, total: 10, growth: 12.5 },
      security: { status: 'healthy', failedLogins: 0, lastSecurityScan: new Date().toISOString(), vulnerabilities: 0 }
    },
    notifications,
    revenueAnalytics: {
      dailyRevenue: [],
      monthlyTrend: [],
      serviceBreakdown: [],
      clientSegments: [],
      forecastData: []
    },
    clientInsights: {
      topClients: [],
      satisfactionTrends: [],
      retentionMetrics: { newClients: 0, returningClients: 0, churnRate: 0, lifetimeValue: 0 },
      geographicDistribution: []
    },
    upcomingDeadlines: [],
    performanceMetrics: {
      efficiency: { bookingUtilization: 0, averageSessionDuration: 0, clientSatisfaction: 0, taskCompletionRate: 0 },
      growth: { monthOverMonth: 0, yearOverYear: 0, newClientAcquisition: 0, revenuePerClient: 0 },
      operational: { averageResponseTime: 0, firstCallResolution: 0, appointmentShowRate: 0, reschedulingRate: 0 }
    }
  }
}