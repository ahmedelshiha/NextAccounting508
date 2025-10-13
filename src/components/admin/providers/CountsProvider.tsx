"use client"

'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useUnifiedData } from '@/hooks/useUnifiedData'

export type AdminCounts = {
  pendingBookings?: number
  newClients?: number
  pendingServiceRequests?: number
  overdueTasks?: number
}

interface CountsContextValue {
  counts: AdminCounts | null
  isLoading: boolean
}

const CountsContext = createContext<CountsContextValue | null>(null)

export function CountsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useUnifiedData<AdminCounts>({
    key: 'stats/counts',
    events: ['booking-created', 'service-request-created', 'task-created'],
    revalidateOnEvents: true,
  })

  const value = useMemo<CountsContextValue>(() => ({
    counts: (data as any) || null,
    isLoading: !!isLoading,
  }), [data, isLoading])

  return (
    <CountsContext.Provider value={value}>
      {children}
    </CountsContext.Provider>
  )
}

export function useCounts() {
  const ctx = useContext(CountsContext)
  if (!ctx) return { counts: null as AdminCounts | null, isLoading: false }
  return ctx
}
