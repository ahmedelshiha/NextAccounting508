'use client'

/**
 * SystemStatus Component
 * 
 * Displays real-time system health status with animated indicators,
 * status messages, and timestamps. Includes both compact and full modes.
 * 
 * @module @/components/admin/layout/Footer/SystemStatus
 */

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { SystemStatusProps } from './types'
import { STATUS_MESSAGES } from './constants'

/**
 * Color mapping for status indicators
 */
const STATUS_COLORS = {
  operational: {
    dot: 'bg-green-500',
    pulse: 'animate-pulse',
    badge: 'bg-green-100 text-green-800',
  },
  degraded: {
    dot: 'bg-yellow-500',
    pulse: 'animate-pulse',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  outage: {
    dot: 'bg-red-500',
    pulse: 'animate-pulse',
    badge: 'bg-red-100 text-red-800',
  },
  unknown: {
    dot: 'bg-gray-400',
    pulse: '',
    badge: 'bg-gray-100 text-gray-800',
  },
}

export function SystemStatus({
  health,
  loading = false,
  error = null,
  compact = false,
}: SystemStatusProps) {
  // Determine status and message
  const statusData = useMemo(() => {
    if (error) {
      return {
        status: 'unknown' as const,
        short: 'Unknown',
        full: 'Unable to check status',
      }
    }

    if (loading && !health) {
      return {
        status: 'unknown' as const,
        short: 'Checking',
        full: 'Checking system status...',
      }
    }

    if (!health) {
      return {
        status: 'unknown' as const,
        short: 'Unknown',
        full: 'System status unavailable',
      }
    }

    const messages = STATUS_MESSAGES[health.status]
    return {
      status: health.status,
      short: messages.short,
      full: health.message || messages.full,
    }
  }, [health, loading, error])

  const colors = STATUS_COLORS[statusData.status]
  const timestamp = health?.timestamp
    ? new Date(health.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : undefined

  // Compact mode: small dot + abbreviated text
  if (compact) {
    return (
      <div className="flex items-center gap-2" role="status" aria-live="polite">
        <div
          className={`h-2 w-2 rounded-full ${colors.dot} ${
            statusData.status === 'operational' ? colors.pulse : ''
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-gray-600">
          {statusData.short}
        </span>
      </div>
    )
  }

  // Full mode: badge + message + timestamp
  return (
    <div className="flex flex-col gap-1" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${colors.dot} ${
            statusData.status === 'operational' ? colors.pulse : ''
          }`}
          aria-hidden="true"
        />
        <Badge className={`${colors.badge} border-0`}>
          {statusData.short}
        </Badge>
      </div>
      <p className="text-sm text-gray-700">{statusData.full}</p>
      {timestamp && (
        <p className="hidden text-xs text-gray-500 md:block">
          Last checked: {timestamp}
        </p>
      )}
    </div>
  )
}

export default SystemStatus
